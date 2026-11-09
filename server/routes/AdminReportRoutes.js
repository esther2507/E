const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const requireAdmin = require("../middleware/requireAdmin");
const AdminReportController = require("../controllers/AdminReportController");

router.get("/", verifyJWT, requireAdmin, AdminReportController.getReport);

module.exports = router;