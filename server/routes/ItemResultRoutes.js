const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const ItemResultController = require("../controllers/ItemResultController");

router.post("/itemresults", verifyJWT, ItemResultController.createItemResult);
router.get("/itemresults", verifyJWT, ItemResultController.getItemResults);

module.exports = router;