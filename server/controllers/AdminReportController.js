const {
    Teacher,
    Student,
    Session,
    ItemResult
} = require("../models/readingModel");

const getReport = async (req, res) => {
    try {
        const teachers = await Teacher.find({ role: "teacher" })
            .select("_id Teachername username")
            .lean();

        const teacherIds = teachers.map((teacher) => teacher._id);

        const students = await Student.find({ teacherId: { $in: teacherIds } }).lean();
        const sessions = await Session.find({ examinerId: { $in: teacherIds } }).lean();
        const results = await ItemResult.find({
            sessionId: { $in: sessions.map((session) => session._id) }
        }).lean();

        const resultsBySession = new Map();
        for (const result of results) {
            const sessionKey = result.sessionId.toString();
            const existing = resultsBySession.get(sessionKey) || [];
            existing.push(result);
            resultsBySession.set(sessionKey, existing);
        }

        const sessionsByStudent = new Map();
        for (const session of sessions) {
            const studentKey = session.studentId.toString();
            const existing = sessionsByStudent.get(studentKey) || [];
            existing.push({
                ...session,
                results: resultsBySession.get(session._id.toString()) || []
            });
            sessionsByStudent.set(studentKey, existing);
        }

        const studentsByTeacher = new Map();
        for (const student of students) {
            const teacherKey = student.teacherId.toString();
            const existing = studentsByTeacher.get(teacherKey) || [];
            existing.push({
                ...student,
                sessions: sessionsByStudent.get(student._id.toString()) || []
            });
            studentsByTeacher.set(teacherKey, existing);
        }

        return res.json(teachers.map((teacher) => ({
            ...teacher,
            students: studentsByTeacher.get(teacher._id.toString()) || []
        })));
    } catch (error) {
        console.error("Could not load admin report:", error);
        return res.status(500).json({ message: "Could not load report" });
    }
};

module.exports = { getReport };