//const bcrypt = require("bcrypt")
//const jwt= require('jsonwebtoken')
const Student = require("../models/readingModel").Student

const createStudent = async (req, res) => {
    try {
        const { Studentname, organization } = req.body           
       // const hashedPassword = await bcrypt.hash(password, 10)
        const student = new Student({
            Studentname,
            organization,
            teacherId: req.user.sub
        //    password: hashedPassword
        })
        await student.save()
        const studentObj = student.toObject()
      //  delete studentObj.password
        res.status(201).json(studentObj)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getStudents = async (req, res) => {
    try {
        const students = await Student.find( { teacherId: req.user.sub })   
        res.status(200).json(students)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}   

const getStudentById = async (req, res) => {    
    try {
        const student = await Student.findOne({teacherId: req.user.sub, _id: req.params.id})
        if (!student) {
            return res.status(404).json({ message: "Student not found" })
        }
        res.status(200).json(student)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }   
}

const updateStudent = async (req, res) => {
    try {
        const { Studentname, organization } = req.body 
        const updateData = { Studentname, organization }
        
        // if (password) {
        //     updateData.password = await bcrypt.hash(password, 10)
        // }
        const student = await Student.findOneAndUpdate({teacherId: req.user.sub, _id: req.params.id}, updateData, { new: true, runValidators: true })
        if (!student) {
            return res.status(404).json({ message: "Student not found" })
        }
                const studentObj = student.toObject()
      //  delete studentObj.password

        res.status(200).json(studentObj)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }         
}

const deleteStudent = async (req, res) => {
    try {
        const student = await Student.findOneAndDelete({teacherId: req.user.sub, _id: req.params.id})  
        if (!student) {
            return res.status(404).json({ message: "Student not found" })
        }
        res.status(200).json({ message: "Student deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}   

module.exports = {
    createStudent,
    getStudents,
    getStudentById,
    updateStudent,
    deleteStudent
}   