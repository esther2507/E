const express = require("express")
const router = express.Router()
const verifyJWT = require("../middleware/verifyJWT")
const SessionController = require("../controllers/SessionController")

//router.post("/Sessions", SessionController.login)
router.get("/Sessions", verifyJWT, SessionController.checkStatus)
router.get("/Sessions", verifyJWT, SessionController.logout)

module.exports = router

 