require("dotenv").config()
const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const connectDB=require("./config/dbConn")
const corsOptions = require("./config/corsOptions")

const app = express()
const PORT = process.env.PORT || 7000

connectDB()
app.use(cors(corsOptions))
app.use(express.static("public"))
app.use(express.json())
const authRoutes = require("./routes/authRoutes")
const AiReportRoutes = require("./routes/AiReportRoutes")
const BoardRoutes = require("./routes/BoardRoutes")
const readingRoutes = require("./routes/readingRoutes")
const StudentRoutes = require("./routes/StudentRoutes")
const TeacherRoutes = require("./routes/TeacherRoutes")
const ItemResultRoutes = require("./routes/ItemResultRoutes")
const SessionRoutes = require("./routes/SessionRoutes")
const AdminReportRoutes = require("./routes/AdminReportRoutes")

app.use("/api/auth", authRoutes)
app.use("/api/AiReportRoutes", AiReportRoutes)
app.use("/api/BoardRoutes", BoardRoutes)
app.use("/api/readingRoutes", readingRoutes)
app.use("/api/StudentRoutes", StudentRoutes)
app.use("/api/TeacherRoutes", TeacherRoutes)
app.use("/api/ItemResultRoutes", ItemResultRoutes)
app.use("/api/SessionRoutes", SessionRoutes)
app.use("/api/admin/reports", AdminReportRoutes)

app.get("/", (req, res) => {
   res.send("This is home page")
})


mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => console.log(`Server running on port${PORT}`))
})
mongoose.connection.on('error', err => {
    console.log(err)
})


// DATABASE_URI=mongodb://localhost:27017/329693279_2026
// ACCESS_TOKEN_SECRET=70071ebe26415bdeaa9566b62201269def91a452462e2920d52b0e73f4c3ffcf6380508c2939e2fd2ec0efe5e62ca9e6b7a50dd191ccf7d03caa574735ecc513
// SEED_TEACHER_NAME=ester
// SEED_TEACHER_USERNAME=eis
// SEED_TEACHER_PASSWORD=estereis3311