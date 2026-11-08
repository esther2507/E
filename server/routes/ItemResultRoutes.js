const express = require("express")
const router = express.Router()
const verifyJWT = require("../middleware/verifyJWT")
const ItemResultController = require("../controllers/ItemResultController")

router.post("/itemresults", verifyJWT, ItemResultController.createItemResult)
router.get("/itemresults", verifyJWT, ItemResultController.getItemResults)
router.get("/itemresults/:id", verifyJWT, ItemResultController.getItemResultById)
router.put("/itemresults/:id", verifyJWT, ItemResultController.updateItemResult)
router.delete("/itemresults/:id", verifyJWT, ItemResultController.deleteItemResult)


    
module.exports = router

