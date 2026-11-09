const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const SessionController = require("../controllers/SessionController");

router.post("/Sessions", verifyJWT, SessionController.createSession);

router.get("/Sessions/:id", verifyJWT, SessionController.checkStatus);

module.exports = router;