const {
    Teacher,
    Student,
    Session,
    ItemResult,
    ReadingResponse
} = require("../models/readingModel");
const { calculateReadingMetrics } = require("../services/readingAssessment");

const getReport = async (req, res) => {
    try {
        const teachers = await Teacher.find({ role: "teacher" })
            .select("_id Teachername username")
            .lean();

        const teacherIds = teachers.map((teacher) => teacher._id);

        const students = await Student.find({ teacherId: { $in: teacherIds } }).lean();
        const sessions = await Session.find({ examinerId: { $in: teacherIds } }).lean();
        const completedSessions = sessions.filter((session) => session.status === "completed");
        const completedSessionIds = completedSessions.map((session) => session._id);
        const [results, readingResponses] = await Promise.all([
            ItemResult.find({ sessionId: { $in: completedSessionIds } }).lean(),
            ReadingResponse.find({ sessionId: { $in: completedSessionIds } }).lean()
        ]);

        const resultsBySession = new Map();
        for (const result of results) {
            const sessionKey = result.sessionId.toString();
            const existing = resultsBySession.get(sessionKey) || [];
            existing.push(result);
            resultsBySession.set(sessionKey, existing);
        }

        const readingBySession = new Map();
        for (const response of readingResponses) {
            const sessionKey = response.sessionId.toString();
            const existing = readingBySession.get(sessionKey) || [];
            existing.push(response);
            readingBySession.set(sessionKey, existing);
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
            const studentSessions = sessionsByStudent.get(student._id.toString()) || [];
            const lastCompletedSession = studentSessions
                .filter((session) => session.status === "completed")
                .sort((first, second) =>
                    new Date(second.completedAt || second.startedAt) -
                    new Date(first.completedAt || first.startedAt)
                )[0];
            const score = lastCompletedSession
                ? calculateReadingMetrics(
                    readingBySession.get(lastCompletedSession._id.toString()) || [],
                    lastCompletedSession.results
                ).overallScore
                : null;

            existing.push({
                ...student,
                sessions: studentSessions,
                score,
                lastExamDate: lastCompletedSession?.completedAt ?? null
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