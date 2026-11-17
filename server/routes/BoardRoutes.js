const express = require("express")
const router = express.Router()
const verifyJWT = require("../middleware/verifyJWT")
const BoardController = require("../controllers/BoardController")

router.post("/boards", verifyJWT, BoardController.createBoard)
router.get("/boards", verifyJWT, BoardController.getBoards)
router.get("/boards/:id", verifyJWT, BoardController.getBoardById)
router.put("/boards/:id", verifyJWT, BoardController.updateBoard)
router.delete("/boards/:id", verifyJWT, BoardController.deleteBoard)


    
module.exports = router