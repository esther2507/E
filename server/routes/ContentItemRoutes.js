const express = require("express")
const router = express.Router()
const verifyJWT = require("../middleware/verifyJWT")
const ContentItemController = require("../controllers/ContentItemController")

router.post("/reports", verifyJWT, ContentItemController.createContentItem)
router.get("/reports", verifyJWT, ContentItemController.getContentItems)
router.get("/reports/:id", verifyJWT, ContentItemController.getContentItemById)
router.put("/reports/:id", verifyJWT, ContentItemController.updateContentItem)
router.delete("/reports/:id", verifyJWT, ContentItemController.deleteContentItem)



module.exports = router