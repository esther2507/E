const bcrypt = require("bcrypt")
const jwt= require('jsonwebtoken')
const Student = require("../models/readingModel").Student

const createContentItem = async (req, res) => {
    try {
        const { Studentname, email, password } = req.body
        const hashedPassword = await bcrypt.hash(password, 10)
        const student = new Student({
            Studentname,
            email,
            password: hashedPassword
        })
        await student.save()
        const studentObj = student.toObject()
        delete studentObj.password
        res.status(201).json(studentObj)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getContentItems = async (req, res) => {
    try {
        const students = await Student.find()   
        res.status(200).json(students)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getContentItemById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)   
        if (!student) {
            return res.status(404).json({ message: "Student not found" })
        }
        res.status(200).json(student)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}   

const updateContentItem = async (req, res) => {
    try {
        const { Studentname, email, password } = req.body   
        const updateData = { Studentname, email }
        if (password) {
            updateData.password = await bcrypt.hash(password, 10)
        }   
        const student = await Student.findByIdAndUpdate(req.params.id, updateData, { new: true })
        if (!student) {
            return res.status(404).json({ message: "Student not found" })
        }
        res.status(200).json(student)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const deleteContentItem = async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id)
        if (!student) {
            return res.status(404).json({ message: "Student not found" })
        }
        res.status(200).json({ message: "Student deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}       

module.exports = {
    createContentItem,
    getContentItems,
    getContentItemById,
    updateContentItem,
    deleteContentItem
}   