const { AiReport, Session, ReadingResponse, ItemResult, Student, Teacher } = require("../models/readingModel")
const mongoose = require("mongoose")
const { calculateReadingMetrics } = require("../services/readingAssessment")

const redactPersonalInfo = (value, privateTerms) => {
    let safeValue = value

    for (const term of privateTerms) {
        if (typeof term !== "string" || term.trim().length < 2) continue
        const escapedTerm = term.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        safeValue = safeValue.replace(new RegExp(escapedTerm, "giu"), "[הושחר]")
    }

    return safeValue
        .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[הושחר]")
        .replace(/\+?\d[\d\s().-]{6,}\d/g, "[הושחר]")
}

const analyzeSession = async (req, res) => {
    try {
        if (req.user?.role !== "teacher") {
            return res.status(403).json({ message: "Only teachers can analyze reading sessions" })
        }

        if (!mongoose.isValidObjectId(req.params.sessionId)) {
            return res.status(400).json({ message: "Valid session ID is required" })
        }

        const session = await Session.findOne({
            _id: req.params.sessionId,
            examinerId: req.user.sub,
            status: "completed"
        }).lean()

        if (!session) {
            return res.status(404).json({ message: "Completed session not found for this teacher" })
        }

        if (!process.env.OPENAI_API_KEY) {
            return res.status(503).json({ message: "AI is not configured. Add OPENAI_API_KEY to the server environment." })
        }

        const [responses, itemResults] = await Promise.all([
            ReadingResponse.find({ sessionId: session._id })
                .sort({ part: 1, createdAt: 1 })
                .lean(),
            ItemResult.find({ sessionId: session._id })
                .sort({ createdAt: 1 })
                .lean()
        ])

        if (!responses.length && !itemResults.length) {
            return res.status(400).json({ message: "No answers were saved for this session" })
        }

        if (responses.some((response) => !response.evaluation)) {
            return res.status(409).json({ message: "Some answers are missing teacher evaluations. Save their evaluations before generating the report." })
        }

        const metrics = calculateReadingMetrics(responses, itemResults)
        const [student, teacher] = await Promise.all([
            Student.findById(session.studentId).select("Studentname organization").lean(),
            Teacher.findById(session.examinerId).select("Teachername username").lean()
        ])
        const privateTerms = [
            student?.Studentname,
            student?.organization,
            teacher?.Teachername,
            teacher?.username
        ]
        const anonymizedResponses = responses.map((response) => ({
            part: response.part,
            expectedAnswer: response.itemText,
            studentAnswer: redactPersonalInfo(response.responseText, privateTerms),
            evaluation: response.evaluation,
            errorType: response.errorType,
            errorDetails: redactPersonalInfo(response.errorDetails || "", privateTerms),
            vowelErrorCount: response.vowelErrorCount
        }))
        const anonymizedItemResults = itemResults.map((result) => ({
            part: "משפטים ותמונות",
            questionGroup: result.questionGroup,
            questionId: result.questionId,
            question: redactPersonalInfo(result.questionText || "", privateTerms),
            expectedOptionId: result.expectedOptionId,
            selectedOptionId: result.selectedOptionId,
            selectedAnswer: redactPersonalInfo(result.selectedValue || "", privateTerms),
            evaluation: result.result
        }))
        const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: process.env.OPENAI_MODEL || "gpt-4o-mini",
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "system",
                        content: "את/ה מסייע/ת למורה לנתח תוצאות של מבדק קריאה בעברית, כולל שאלות הבנת משפטים עם תמונות ושלבי קריאה. שאלות תמונה מתוארות לפי מספר אפשרות בלבד; אין לנחש את תוכן התמונה. כל המספרים חושבו מראש ואין לשנות אותם או להמציא נתונים. הציון מבוסס רק על הפריטים שנשמרו, לכן אל תציג/י אותו כאילו כל המבדק הושלם. החזר/י JSON בלבד עם המפתחות summary (מחרוזת), strengths (מערך מחרוזות), recommendations (מערך מחרוזות), nextSteps (מערך מחרוזות). כתוב/י בעברית, בניסוח תמציתי ומעשי למורה. התייחס/י רק לנתונים שסופקו, אל תאבחן/י לקות ואל תכלול/י פרטים מזהים."
                    },
                    {
                        role: "user",
                        content: JSON.stringify({
                            metrics,
                            responses: anonymizedResponses,
                            sentenceAndImageResponses: anonymizedItemResults
                        })
                    }
                ]
            })
        })

        let openAiData
        try {
            openAiData = await openAiResponse.json()
        } catch {
            openAiData = null
        }

        if (!openAiResponse.ok) {
            console.error("OpenAI report request failed:", openAiData?.error?.message || openAiResponse.status)
            return res.status(502).json({ message: "The AI report could not be generated. Check the server's OpenAI configuration and try again." })
        }

        const content = openAiData?.choices?.[0]?.message?.content
        if (typeof content !== "string") {
            return res.status(502).json({ message: "The AI returned an invalid report. Please try again." })
        }

        let generatedReport
        try {
            generatedReport = JSON.parse(content)
        } catch {
            return res.status(502).json({ message: "The AI returned an invalid report. Please try again." })
        }

        if (
            !generatedReport ||
            typeof generatedReport !== "object" ||
            typeof generatedReport.summary !== "string" ||
            !generatedReport.summary.trim() ||
            !["strengths", "recommendations", "nextSteps"].every((key) =>
                Array.isArray(generatedReport[key]) &&
                generatedReport[key].every((item) => typeof item === "string")
            )
        ) {
            return res.status(502).json({ message: "The AI returned an incomplete report. Please try again." })
        }

        const aiOutputJson = {
            overallScore: metrics.overallScore,
            summary: generatedReport.summary.trim(),
            strengths: generatedReport.strengths,
            recommendations: generatedReport.recommendations,
            nextSteps: generatedReport.nextSteps
        }
        const report = await AiReport.findOneAndUpdate(
            { sessionId: session._id, part: "reading_assessment" },
            {
                metricsJson: metrics,
                aiOutputJson,
                editedByExaminer: false
            },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        ).lean()

        return res.status(200).json({ report })
    } catch (error) {
        console.error("Could not generate AI reading report:", error.message)
        return res.status(500).json({ message: "Could not generate the reading report" })
    }
}

const getSessionReport = async (req, res) => {
    try {
        if (req.user?.role !== "teacher") {
            return res.status(403).json({ message: "Only teachers can view reading reports" })
        }

        if (!mongoose.isValidObjectId(req.params.sessionId)) {
            return res.status(400).json({ message: "Valid session ID is required" })
        }

        const session = await Session.findOne({
            _id: req.params.sessionId,
            examinerId: req.user.sub
        }).select("_id").lean()

        if (!session) {
            return res.status(404).json({ message: "Session not found for this teacher" })
        }

        const report = await AiReport.findOne({
            sessionId: session._id,
            part: "reading_assessment"
        }).lean()

        if (!report) {
            return res.status(404).json({ message: "No AI report was found for this session" })
        }

        return res.json({ report })
    } catch (error) {
        console.error("Could not load AI reading report:", error.message)
        return res.status(500).json({ message: "Could not load the reading report" })
    }
}

const findAuthorizedReport = async (reportId, user) => {
    const report = await AiReport.findById(reportId)
    if (!report) return null
    if (user?.role === "admin") return report

    const session = await Session.findOne({
        _id: report.sessionId,
        examinerId: user?.sub
    }).select("_id").lean()

    return session ? report : null
}

const createAiReport = async (req, res) => {
    try {
        const { sessionId, part, metricsJson, aiOutputJson } = req.body
        if (
            req.user?.role !== "teacher" ||
            !mongoose.isValidObjectId(sessionId) ||
            typeof part !== "string" ||
            !metricsJson ||
            typeof metricsJson !== "object" ||
            !aiOutputJson ||
            typeof aiOutputJson !== "object"
        ) {
            return res.status(400).json({ message: "Invalid AI report data" })
        }

        const session = await Session.findOne({
            _id: sessionId,
            examinerId: req.user.sub
        }).select("_id").lean()
        if (!session) {
            return res.status(404).json({ message: "Session not found for this teacher" })
        }

        const report = await AiReport.create({
            sessionId,
            part,
            metricsJson,
            aiOutputJson,
            editedByExaminer: true
        })
        return res.status(201).json(report)
    } catch (error) {
        console.error("Could not save AI report:", error.message)
        return res.status(500).json({ message: "Could not save AI report" })
    }
}

const getAiReports = async (req, res) => {
    try {
        const sessionIds = req.user?.role === "admin"
            ? undefined
            : await Session.find({ examinerId: req.user?.sub }).distinct("_id")
        const reports = await AiReport.find(
            sessionIds ? { sessionId: { $in: sessionIds } } : {}
        ).lean()
        return res.status(200).json(reports)
    } catch (error) {
        console.error("Could not load AI reports:", error.message)
        return res.status(500).json({ message: "Could not load AI reports" })
    }
}

const getAiReportById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Valid report ID is required" })
        }
        const report = await findAuthorizedReport(req.params.id, req.user)
        if (!report) {
            return res.status(404).json({ message: "AI report not found" })
        }
        return res.status(200).json(report)
    } catch (error) {
        console.error("Could not load AI report:", error.message)
        return res.status(500).json({ message: "Could not load AI report" })
    }
}           

const updateAiReport = async (req, res) => {        
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Valid report ID is required" })
        }
        const report = await findAuthorizedReport(req.params.id, req.user)
        if (!report) {
            return res.status(404).json({ message: "AI report not found" })
        }
        const { aiOutputJson } = req.body
        if (
            !aiOutputJson ||
            typeof aiOutputJson !== "object" ||
            aiOutputJson.overallScore !== report.metricsJson.overallScore
        ) {
            return res.status(400).json({ message: "Invalid AI report update" })
        }
        const updatedReport = await AiReport.findByIdAndUpdate(
            report._id,
            { aiOutputJson, editedByExaminer: true },
            { new: true, runValidators: true }
        ).lean()
        return res.status(200).json(updatedReport)
    } catch (error) {
        console.error("Could not update AI report:", error.message)
        return res.status(500).json({ message: "Could not update AI report" })
    }
}

const deleteAiReport = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Valid report ID is required" })
        }
        const report = await findAuthorizedReport(req.params.id, req.user)
        if (!report) {
            return res.status(404).json({ message: "AI report not found" })
        }
        await AiReport.findByIdAndDelete(report._id)
        return res.status(200).json({ message: "AI report deleted successfully" })
    } catch (error) {
        console.error("Could not delete AI report:", error.message)
        return res.status(500).json({ message: "Could not delete AI report" })
    }
}

module.exports = {
    analyzeSession,
    getSessionReport,
    createAiReport,
    getAiReports,
    getAiReportById,
    updateAiReport,
    deleteAiReport
}   