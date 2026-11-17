const {Teacher} = require('./models/readingModel'); 
const bcrypt = require('bcrypt');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
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


mongoose.connection.once('open', async () => {
    const existingTeacher = await Teacher.findOne({ username: process.env.SEED_TEACHER_USERNAME });
        if (!existingTeacher) {
            const hashedPassword = await bcrypt.hash(process.env.SEED_TEACHER_PASSWORD, 10);
            await Teacher.create({
                Teachername: process.env.SEED_TEACHER_USERNAME,
                username: process.env.SEED_TEACHER_USERNAME,
                password: hashedPassword,
                role: 'admin' 
            });
            console.log('Default admin user seeded successfully in Atlas!');
        }

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
mongoose.connection.on('error', err => {
    console.log(err)
})


// DATABASE_URI=mongodb://localhost:27017/329693279_2026
// ACCESS_TOKEN_SECRET=70071ebe26415bdeaa9566b62201269def91a452462e2920d52b0e73f4c3ffcf6380508c2939e2fd2ec0efe5e62ca9e6b7a50dd191ccf7d03caa574735ecc513
// SEED_TEACHER_NAME=ester
// SEED_TEACHER_USERNAME=eis
// SEED_TEACHER_PASSWORD=estereis3311


//2...
// DATABASE_URI=mongodb+srv://ester:3311@cluster0.u4ognd6.mongodb.net/329693279_2026?retryWrites=true&w=majority
// ACCESS_TOKEN_SECRET=70071ebe26415bdeaa9566b62201269def91a452462e2920d52b0e73f4c3ffcf6380508c2939e2fd2ec0efe5e62ca9e6b7a50dd191ccf7d03caa574735ecc513
// SEED_TEACHER_NAME=ester
// SEED_TEACHER_USERNAME=eis
// SEED_TEACHER_PASSWORD=estereis3311
