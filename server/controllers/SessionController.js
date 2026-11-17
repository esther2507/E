const mongoose = require("mongoose");
const { Student, Session } = require("../models/readingModel");
const { gradeSession } = require("../services/gradingService");

const createSession = async (req, res) => {
    try {
        if (req.user?.role !== "teacher") {
            return res.status(403).json({ message: "Only teachers can start a session" });
        }

        const { studentId } = req.body;

        if (!mongoose.isValidObjectId(studentId)) {
            return res.status(400).json({ message: "Valid studentId is required" });
        }

        const student = await Student.findOne({
            _id: studentId,
            teacherId: req.user.sub
        });

        if (!student) {
            return res.status(404).json({ message: "Student not found for this teacher" });
        }
        
        const session = await Session.create({
            studentId: student._id,
            examinerId: req.user.sub,
            status: "in_progress"
        });

        return res.status(201).json({ session });
    } catch (error) {
        console.error("Could not create session:", error);
        return res.status(500).json({ message: "Could not create session" });
    }
};

const checkStatus = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Valid session ID is required" });
        }

        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        const isAdmin = req.user?.role === "admin";
        const isSessionTeacher =
            session.examinerId.toString() === req.user?.sub;

        if (!isAdmin && !isSessionTeacher) {
            return res.status(403).json({ message: "Access denied" });
        }

        return res.status(200).json({ status: session.status, session });
    } catch (error) {
        console.error("Could not check session status:", error);
        return res.status(500).json({ message: "Could not check session status" });
    }
};

const completeSession = async (req, res) => {
    try {
        const session = await Session.findOne({
            _id: req.params.id,
            examinerId: req.user.sub
        });

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        // שמירה מיידית של הסשן כהושלם (בלתי תלוי בהצלחת ה-AI)
        session.status = "completed";
        session.completedAt = new Date();
        await session.save();

        try {
            const report = await gradeSession(session._id, req.user.sub);
            return res.status(200).json({ session, report });
        } catch (error) {
            console.error("Could not grade completed session:", {
                message: error.message,
                statusCode: error.statusCode,
                upstreamStatus: error.upstreamStatus,
                requestId: error.requestId
            });

            // טיפול ממוקד בשגיאות חיצוניות (עומס 503 או חריגת מכסה 429)
            let gradingError = "המבחן הסתיים ונשמר בהצלחה, אך הפקת הדו\"ח נכשלה זמנית.";
            
            const status = error.statusCode || error.upstreamStatus;
            if (status === 503) {
                gradingError = "שירות ה-AI חווה עומס זמני (503). המבחן נשמר בהצלחה, ניתן לנסות שוב מאוחר יותר.";
            } else if (status === 429) {
                gradingError = "חריגה ממכסת הקריאות מול ספק ה-AI (429). המבחן נשמר בהצלחה.";
            } else if (error.message && error.message.includes("ANTHROPIC_API_KEY")) {
                gradingError = "יש להגדיר ANTHROPIC_API_KEY בקובץ server/.env כדי להפיק ציון ומשוב.";
            }

            // החזרת 200 עם הסשן השמור כדי שהמערכת לא תציג "אין בחינה"
            return res.status(200).json({ session, report: null, gradingError });
        }
    } catch (error) {
        console.error("Could not complete session:", error.message);
        return res.status(500).json({ message: "לא ניתן לסיים את המבחן כרגע." });
    }
};

const gradeCompletedSession = async (req, res) => {
    try {
        const session = await Session.findOne({
            _id: req.params.id,
            examinerId: req.user.sub,
            status: "completed"
        });

        if (!session) {
            return res.status(404).json({ message: "Completed session not found" });
        }

        const report = await gradeSession(session._id, req.user.sub);
        return res.status(200).json({ report });
    } catch (error) {
        console.error("Could not grade completed session:", {
            message: error.message,
            statusCode: error.statusCode,
            upstreamStatus: error.upstreamStatus,
            requestId: error.requestId
        });

        const status = error.statusCode || error.upstreamStatus || 500;
        let message = "לא ניתן להפיק ציון כרגע. בדקו את החיבור ל־Claude ונסו שוב.";

        if (status === 503) {
            message = "שירות ה-AI חווה עומס זמני (503). נסו שוב מאוחר יותר.";
        } else if (status === 429) {
            message = "חריגה ממכסת הקריאות (429) מול ספק ה-AI.";
        } else if (error.upstreamStatus) {
            message = `Claude החזיר שגיאה ${error.upstreamStatus}: ${error.message}`;
        }

        return res.status(status === 429 || status === 503 ? 200 : status).json({ message });
    }
};

module.exports = {
    createSession,
    checkStatus,
    completeSession,
    gradeCompletedSession
};