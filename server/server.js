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

// app.listen(PORT, () => {
//    console.log(`Server run on ${PORT}`)
// })

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => console.log(`Server running on port${PORT}`))
})
mongoose.connection.on('error', err => {
    console.log(err)
})