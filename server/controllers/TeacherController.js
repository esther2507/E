const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Teacher = require('../models/readingModel').Teacher

const createTeacher = async (req, res) => {
    try {
        const { Teachername, username, password } = req.body
        const hashedPassword = await bcrypt.hash(password, 10)
        const teacher = new Teacher({
            Teachername,
            username,
            password: hashedPassword
        })
        await teacher.save()
        const teacherObj = teacher.toObject()
        delete teacherObj.password
        res.status(201).json(teacherObj)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const login = async (req, res) => {
    try {
        const { username, password } = req.body
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" })
        }
        if (!process.env.ACCESS_TOKEN_SECRET) {

            return res.status(500).json({ message: "Server authentication is not configured" })
        }
        const teacher = await Teacher.findOne({ username }).select("+password")
        if (!teacher || !(await bcrypt.compare(password, teacher.password))) {

            return res.status(401).json({ message: "Invalid credentials" })
        }
        const accessToken = jwt.sign(

            { role: teacher.role },

            process.env.ACCESS_TOKEN_SECRET,

            { subject: teacher._id.toString(), expiresIn: "1h" }

        )
        const teacherObj = teacher.toObject()
        delete teacherObj.password
        return res.status(200).json({

            accessToken,

            teacher: teacherObj
        })

    } catch (error) {

        return res.status(500).json({ message: "Login failed" })
    }
}

const getTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.find()
        res.status(200).json(teachers)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getTeacherById = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id)
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" })
        }
        res.status(200).json(teacher)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
const updateTeacher = async (req, res) => {
    try {
        const { Teachername, username, password } = req.body
        const updateData = { Teachername, username }
        if (password) {
            updateData.password = await bcrypt.hash(password, 10)
        }
        const teacher = await Teacher.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        )
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" })
        }
        res.status(200).json(teacher)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
const deleteTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findByIdAndDelete(req.params.id)
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" })
        }
        res.status(200).json({ message: "Teacher deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
module.exports = {
    createTeacher,
    login,
    getTeachers,
    getTeacherById,
    updateTeacher,
    deleteTeacher
}