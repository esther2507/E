const express = require("express")
const router = express.Router()
const requireAdmin = require("../middleware/requireAdmin");
const TeacherController = require("../controllers/TeacherController")
const verifyJWT = require("../middleware/verifyJWT")
    
router.post("/teachers", verifyJWT, requireAdmin, TeacherController.createTeacher)
router.get("/teachers", verifyJWT, requireAdmin, TeacherController.getTeachers)
router.get("/teachers/:id", verifyJWT, requireAdmin, TeacherController.getTeacherById)
router.put("/teachers/:id", verifyJWT, requireAdmin, TeacherController.updateTeacher)
router.delete("/teachers/:id", verifyJWT, requireAdmin, TeacherController.deleteTeacher)
router.post("/login", TeacherController.login)

module.exports = router

