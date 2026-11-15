const mongoose = require("mongoose");
const { ItemResult, Session, ReadingResponse } = require("../models/readingModel");
const { wordToImageAnswerKey } = require("../services/readingAssessment");
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')
const e = require("express")

const getCanonicalReadingItem = async (part, boardName, itemIndex) => {
    const readingData = await import("../../src/data/readingData.js");

    if (part === "letters") {
        const letters = boardName === "אותיות בסדר רגיל"
            ? readingData.lettersOrdered
            : boardName === "אותיות מעורבבות"
                ? readingData.lettersRandom
                : null;
        return letters?.[itemIndex];
    }

    const boards = part === "combos"
        ? readingData.combosBoards
        : readingData.nonwordsBoards;
    return boards.find((board) => board.name === boardName)?.items[itemIndex];
};

const createReadingResponse = async (req, res) => {
    try {
        if (req.user?.role !== "teacher") {
            return res.status(403).json({ message: "Only teachers can save reading responses" });
        }

        const {
            sessionId,
            part,
            boardName,
            itemIndex,
            itemText,
            responseText,
            evaluation,
            errorType,
            errorDetails,
            vowelErrorCount
        } = req.body;

        const vowelOccurrences = typeof itemText === "string"
            ? (itemText.match(/[\u05B0-\u05BB]/g) || []).length
            : 0;
        const hasError = evaluation === "error";
        const allowedErrorTypes = ["vowel", "auditory", "visual", "omission", "addition", "substitution", "other"];

        if (
            !mongoose.isValidObjectId(sessionId) ||
            !["letters", "combos", "nonwords"].includes(part) ||
            typeof boardName !== "string" ||
            !boardName.trim() ||
            !Number.isInteger(itemIndex) ||
            itemIndex < 0 ||
            typeof itemText !== "string" ||
            !itemText.trim() ||
            typeof responseText !== "string" ||
            !responseText.trim() ||
            !["accurate", "error"].includes(evaluation) ||
            (hasError && (
                !allowedErrorTypes.includes(errorType) ||
                typeof errorDetails !== "string" ||
                !errorDetails.trim()
            )) ||
            (!hasError && (
                errorType !== "none" ||
                Number(vowelErrorCount || 0) !== 0 ||
                (typeof errorDetails === "string" && errorDetails.trim())
            )) ||
            (hasError && errorType === "vowel" && (
                !Number.isInteger(vowelErrorCount) ||
                vowelErrorCount < 1 ||
                vowelErrorCount > vowelOccurrences
            )) ||
            (hasError && errorType !== "vowel" && Number(vowelErrorCount || 0) !== 0) ||
            (typeof errorDetails === "string" && errorDetails.length > 300)
        ) {
            return res.status(400).json({ message: "Invalid reading response data" });
        }

        const canonicalItem = await getCanonicalReadingItem(part, boardName.trim(), itemIndex);
        if (canonicalItem !== itemText.trim()) {
            return res.status(400).json({ message: "Reading item does not match the assessment content" });
        }

        const session = await Session.findOne({
            _id: sessionId,
            examinerId: req.user.sub
        });

        if (!session) {
            return res.status(404).json({ message: "Session not found for this teacher" });
        }

        const savedResponse = await ReadingResponse.findOneAndUpdate(
            {
                sessionId,
                part,
                boardName: boardName.trim(),
                itemIndex
            },
            {
                $set: {
                    itemText: itemText.trim(),
                    responseText: responseText.trim(),
                    evaluation,
                    errorType,
                    errorDetails: typeof errorDetails === "string" ? errorDetails.trim() : "",
                    vowelErrorCount: Number(vowelErrorCount || 0)
                }
            },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        return res.status(201).json(savedResponse);
    } catch (error) {
        console.error("Could not save reading response:", error);
        return res.status(500).json({ message: "Could not save reading response" });
    }
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
            questionText,
            selectedOptionId,
            selectedValue
        } = req.body;

        const expectedOptionId = wordToImageAnswerKey[`${questionGroup}:${questionId}`];
        if (!mongoose.isValidObjectId(sessionId)) {
            return res.status(400).json({ message: "Valid sessionId is required" });
        }

        if (
            !["0", "1", "2"].includes(questionGroup) ||
            !Number.isInteger(questionId) ||
            !Number.isInteger(expectedOptionId) ||
            !Number.isInteger(selectedOptionId) ||
            selectedOptionId < 1 ||
            selectedOptionId > 3 ||
            (questionText !== undefined && (
                typeof questionText !== "string" ||
                questionText.length > 500
            )) ||
            (selectedValue !== undefined && (
                typeof selectedValue !== "string" ||
                selectedValue.length > 500
            ))
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
            questionText: questionText || "",
            selectedOptionId,
            expectedOptionId,
            selectedValue: selectedValue || "",
            result: selectedOptionId === expectedOptionId ? "correct" : "incorrect"
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
    createReadingResponse,
    createItemResult,
    getItemResults,
    getItemResultById,
    updateItemResult,
    deleteItemResult
}