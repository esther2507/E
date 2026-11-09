const mongoose = require("mongoose");
const { Student, Session } = require("../models/readingModel");

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

module.exports = {
    createSession,
    checkStatus
};