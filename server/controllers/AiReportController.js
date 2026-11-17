const bcrypt = require("bcrypt")
const jwt= require('jsonwebtoken')
const AiReport = require("../models/readingModel").AiReport

const createAiReport = async (req, res) => {
    try {
        const { sessionId, part, metricsJson, aiOutputJson, editedByExaminer } = req.body;          
        
        const aiReport = new AiReport({
            sessionId,
            part,
            metricsJson,
            aiOutputJson,
            editedByExaminer
        });
        
        // תיקון: הפעלת save() על המופע שיצרנו
        await aiReport.save();
        
        const aiReportObj = aiReport.toObject();
        res.status(201).json(aiReportObj);
    } catch (error) {
        console.error("Error saving AI report:", error);
        res.status(500).json({ message: error.message });
    }
}

const getAiReports = async (req, res) => {
    try {
        const AiReports = await AiReport.find().select('-password')   
        res.status(200).json(AiReports)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getAiReportById = async (req, res) => {
    try {
        const AiReport = await AiReport.findById(req.params.id).select('-password')   
        if (!AiReport) {
            return res.status(404).json({ message: "AiReport not found" })
        }
        res.status(200).json(AiReport)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}           

const updateAiReport = async (req, res) => {        
    try {
        const { AiReportname, email, password } = req.body   
        const updateData = { AiReportname, email }
        if (password) {
            updateData.password = await bcrypt.hash(password, 10)
        }
        const AiReport = await AiReport.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password')
        if (!AiReport) {
            return res.status(404).json({ message: "AiReport not found" })
        }
        res.status(200).json(AiReport)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const deleteAiReport = async (req, res) => {
    try {
        const AiReport = await AiReport.findByIdAndDelete(req.params.id)
        if (!AiReport) {
            return res.status(404).json({ message: "AiReport not found" })
        }
        res.status(200).json({ message: "AiReport deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports = {
    createAiReport,
    getAiReports,
    getAiReportById,
    updateAiReport,
    deleteAiReport
}   