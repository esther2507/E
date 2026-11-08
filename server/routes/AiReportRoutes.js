const express = require("express")
const router = express.Router()
const verifyJWT = require("../middleware/verifyJWT")
const AiReportController = require("../controllers/AiReportController")

router.post("/reports", verifyJWT, AiReportController.createAiReport)
router.get("/reports", verifyJWT, AiReportController.getAiReports)
router.get("/reports/:id", verifyJWT, AiReportController.getAiReportById)
router.put("/reports/:id", verifyJWT, AiReportController.updateAiReport)
router.delete("/reports/:id", verifyJWT, AiReportController.deleteAiReport)


module.exports = router