const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const studentController = require("../controllers/StudentController")

router.post("/", verifyJWT, studentController.createStudent);
router.get("/", verifyJWT, studentController.getStudents);
router.get("/:id", verifyJWT, studentController.getStudentById);
router.put("/:id", verifyJWT, studentController.updateStudent);
router.delete("/:id", verifyJWT, studentController.deleteStudent);

module.exports = router