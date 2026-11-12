//const bcrypt = require("bcrypt")
//const jwt= require('jsonwebtoken')
const { Student, Session, ItemResult } = require("../models/readingModel");

const createStudent = async (req, res) => {
    try {
        const { Studentname, organization } = req.body
        const existingStudent = await Student.findOne({
            Studentname,
            teacherId: req.user.sub
        })

        if (existingStudent) {
            existingStudent.organization = organization
            await existingStudent.save()
            return res.status(200).json(existingStudent)
        }

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
        const students = await Student.find({ teacherId: req.user.sub })
        res.status(200).json(students)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getStudentById = async (req, res) => {
    try {
        const student = await Student.findOne({ teacherId: req.user.sub, _id: req.params.id })
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
        const student = await Student.findOneAndUpdate({ teacherId: req.user.sub, _id: req.params.id }, updateData, { new: true, runValidators: true })
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
        const student = await Student.findOneAndDelete({ teacherId: req.user.sub, _id: req.params.id })
        if (!student) {
            return res.status(404).json({ message: "Student not found" })
        }
        res.status(200).json({ message: "Student deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getStudentSummary = async (req, res) => {
    try {
        const role = req.user?.role;

        if (!["teacher", "admin"].includes(role)) {
            return res.status(403).json({ message: "Access denied" });
        }

        const studentFilter =
            role === "admin"
                ? {}
                : { teacherId: req.user.sub };

        const students = await Student.find(studentFilter).lean();

        const summary = await Promise.all(
            students.map(async (student) => {
                const lastSession = await Session.findOne({
                    studentId: student._id,
                    status: "completed"
                })
                    .sort({ completedAt: -1, startedAt: -1 })
                    .lean();

                if (!lastSession) {
                    return {
                        studentId: student._id,
                        studentName: student.Studentname,
                        age: student.age ?? null,
                        score: null,
                        lastExamDate: null
                    };
                }

                const answers = await ItemResult.find({
                    sessionId: lastSession._id
                })
                    .select("result")
                    .lean();

                const score = answers.length
                    ? Math.round(
                        (answers.filter((answer) => answer.result === "correct").length /
                            answers.length) *
                        100
                    )
                    : null;

                return {
                    studentId: student._id,
                    studentName: student.Studentname,
                    age: student.age ?? null,
                    score,
                    lastExamDate: lastSession.completedAt ?? lastSession.startedAt
                };
            })
        );

        return res.json(summary);
    } catch (error) {
        console.error("Could not load student summary:", error);
        return res.status(500).json({ message: "Could not load student summary" });
    }
};

module.exports = {
    createStudent,
    getStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
    getStudentSummary
}   