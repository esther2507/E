const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const corsOptions = require("./config/corsOptions")
//const log = require("./middleware/verifyJWT")

const app = express()
const PORT = process.env.PORT || 7000

mongoose.connect("mongodb://localhost:27017/myapp")
 
app.use(cors(corsOptions))
app.use(express.static("public"))
app.use(express.json())
//app.use(log)
const authRoutes = require("./routes/authRoutes")
const AiReportRoutes = require("./routes/AiReportRoutes")
const BoardRoutes = require("./routes/BoardRoutes")
const readingRoutes = require("./routes/readingRoutes")
const StudentRoutes = require("./routes/StudentRoutes")
const TeacherRoutes = require("./routes/TeacherRoutes")
const ItemResultRoutes = require("./routes/ItemResultRoutes")
const SessionRoutes = require("./routes/SessionRoutes")

app.use("/api/auth", authRoutes)
app.use("/api/AiReportRoutes", AiReportRoutes)
app.use("/api/BoardRoutes", BoardRoutes)
app.use("/api/readingRoutes", readingRoutes)
app.use("/api/StudentRoutes", StudentRoutes)
app.use("/api/TeacherRoutes", TeacherRoutes)
app.use("/api/ItemResultRoutes", ItemResultRoutes)
app.use("/api/SessionRoutes", SessionRoutes)
//app.use("/api/auth", require("./routes/authRoute"))

app.get("/", (req, res) => {
   res.send("This is home page")
})

app.listen(PORT, () => {
   console.log(`Server run on ${PORT}`)
})