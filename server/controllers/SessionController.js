//const bcrypt = require("bcrypt")
const jwt= require('jsonwebtoken')
const Student = require("../models/readingModel").Student

// const login = async (req, res) => {
//     try {
//         const { email, password } = req.body
//         const student = await Student.findOne({ email }).select("+password")

//         if (!student) {
//             return res.status(404).json({ message: "Student not found" })
//         }

//         const isMatch = await bcrypt.compare(password, student.password)

//         if (!isMatch) {
//             return res.status(401).json({ message: "Invalid credentials" })
//         }

//         res.status(200).json({ message: "Login successful" })
//     } catch (error) {
//         res.status(500).json({ message: error.message })
//     }
// }

const checkStatus = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
        if (!student) {
            return res.status(404).json({ message: "Student not found" })
        }
        res.status(200).json({ message: "Student status checked successfully" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}   

const logout = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)   
        if (!student) {
            return res.status(404).json({ message: "Student not found" })
        }
        res.status(200).json({ message: "Logout successful" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}   

module.exports = {
   // login,
    checkStatus,
    logout
}