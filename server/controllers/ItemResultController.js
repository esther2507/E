const bcrypt = require("bcrypt")
const jwt= require('jsonwebtoken')
const e = require("express")
const ItemResult = require("../models/readingModel").ItemResult

const createItemResult = async (req, res) => {
    try {
        const { ItemResultname, email, password } = req.body   
        const hashedPassword = await bcrypt.hash(password, 10)
        const ItemResult = new ItemResult({
            ItemResultname,
            email,
            password: hashedPassword
        })
        await ItemResult.save()
        const ItemResultObj = ItemResult.toObject()
        delete ItemResultObj.password
        res.status(201).json(ItemResultObj)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getItemResults = async (req, res) => {
    try {
        const ItemResults = await ItemResult.find()                   
        res.status(200).json(ItemResults)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

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