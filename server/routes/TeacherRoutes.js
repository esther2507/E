const express = require("express")
const router = express.Router()
const TeacherController = require("../controllers/TeacherController")
const verifyJWT = require("../middleware/verifyJWT")
    
router.post("/teachers", verifyJWT, TeacherController.createTeacher)
router.get("/teachers", verifyJWT, TeacherController.getTeachers)
router.get("/teachers/:id", verifyJWT, TeacherController.getTeacherById)
router.put("/teachers/:id", verifyJWT, TeacherController.updateTeacher)
router.delete("/teachers/:id", verifyJWT, TeacherController.deleteTeacher)



module.exports = router

