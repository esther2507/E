const bcrypt = require("bcrypt")
const jwt= require('jsonwebtoken')
const Board = require("../models/readingModel").Board

const createBoard = async (req, res) => {
    try {
        const { Boardname, email, password } = req.body
        const hashedPassword = await bcrypt.hash(password, 10)
        const Board = new Board({
            Boardname,
            email,
            password: hashedPassword
        })
        await Board.save()
        const BoardObj = Board.toObject()
        delete BoardObj.password
        res.status(201).json(BoardObj)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getBoards = async (req, res) => {
    try {
        const Boards = await Board.find().select('-password')   
        res.status(200).json(Boards)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getBoardById = async (req, res) => {
    try {
        const Board = await Board.findById(req.params.id).select('-password')   
        if (!Board) {
            return res.status(404).json({ message: "Board not found" })
        }
        res.status(200).json(Board)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}       

const updateBoard = async (req, res) => {
    try {
        const { Boardname, email, password } = req.body   
        const updateData = { Boardname, email }
        if (password) {
            updateData.password = await bcrypt.hash(password, 10)
        }   
        const Board = await Board.findByIdAndUpdate(req.params.id, updateData, { new: true })
        if (!Board) {
            return res.status(404).json({ message: "Board not found" })
        }
        res.status(200).json(Board)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const deleteBoard = async (req, res) => {
    try {
        const Board = await Board.findByIdAndDelete(req.params.id)
        if (!Board) {
            return res.status(404).json({ message: "Board not found" })
        }
        res.status(200).json({ message: "Board deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}   

module.exports = {
    createBoard,
    getBoards,
    getBoardById,
    updateBoard,
    deleteBoard
}