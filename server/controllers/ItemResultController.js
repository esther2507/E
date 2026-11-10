const mongoose = require("mongoose");
const { ItemResult, Session } = require("../models/readingModel");
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')
const e = require("express")

const answerKey = {
    "0:1": 3,
    "0:2": 1,
    "0:3": 1,
    "1:4": 2,
    "1:5": 2,
    "1:6": 3,
    "1:7": 3,
    "2:8": 3,
    "2:9": 2,
    "2:10": 2
};
const createItemResult = async (req, res) => {
    try {
        if (req.user?.role !== "teacher") {
            return res.status(403).json({ message: "Only teachers can save answers" });
        }

        const {
            sessionId,
            questionGroup,
            questionId,
            selectedOptionId,
            selectedValue,
            result
        } = req.body;

        if (!mongoose.isValidObjectId(sessionId)) {
            return res.status(400).json({ message: "Valid sessionId is required" });
        }

        if (
            !questionGroup ||
            !Number.isInteger(questionId) ||
            !Number.isInteger(selectedOptionId) ||
            !["correct", "incorrect", "self_corrected"].includes(result)
        ) {
            return res.status(400).json({ message: "Invalid answer data" });
        }

        const session = await Session.findOne({
            _id: sessionId,
            examinerId: req.user.sub
        });

        if (!session) {
            return res.status(404).json({ message: "Session not found for this teacher" });
        }

        const savedResult = await ItemResult.create({
            sessionId,
            questionGroup,
            questionId,
            selectedOptionId,
            selectedValue: selectedValue || "",
            result
        });

        return res.status(201).json(savedResult);
    } catch (error) {
        console.error("Could not save item result:", error);
        return res.status(500).json({ message: "Could not save answer" });
    }
};

const getItemResults = async (req, res) => {
    try {
        const role = req.user?.role;

        if (!["teacher", "admin"].includes(role)) {
            return res.status(403).json({ message: "Access denied" });
        }
        if (role === "admin") {
            const results = await ItemResult.find().lean();
            return res.json(results);
        }
        const sessions = await Session.find({ examinerId: req.user.sub })
            .select("_id")
            .lean();

        const sessionIds = sessions.map((session) => session._id);

        const results = await ItemResult.find({
            sessionId: { $in: sessionIds }
        }).lean();

        return res.json(results);
    } catch (error) {
        console.error("Could not load results:", error);
        return res.status(500).json({ message: "Could not load results" });
    }
};

const getItemResultById = async (req, res) => {
    try {
        const ItemResult = await ItemResult.findById(req.params.id)
        if (!ItemResult) {
            return res.status(404).json({ message: "ItemResult not found" })
        }
        res.status(200).json(ItemResult)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const updateItemResult = async (req, res) => {
    try {
        const { ItemResultname, email, password } = req.body
        const updateData = { ItemResultname, email }
        if (password) {
            updateData.password = await bcrypt.hash(password, 10)
        }
        const ItemResult = await ItemResult.findByIdAndUpdate(req.params.id, updateData, { new: true })
        if (!ItemResult) {
            return res.status(404).json({ message: "ItemResult not found" })
        }
        res.status(200).json(ItemResult)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const deleteItemResult = async (req, res) => {
    try {
        const ItemResult = await ItemResult.findByIdAndDelete(req.params.id)
        if (!ItemResult) {
            return res.status(404).json({ message: "ItemResult not found" })
        }
        res.status(200).json({ message: "ItemResult deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports = {
    createItemResult,
    getItemResults,
    getItemResultById,
    updateItemResult,
    deleteItemResult
}