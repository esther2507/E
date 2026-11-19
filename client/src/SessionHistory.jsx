import { useEffect, useRef, useState } from 'react';
import './SessionHistory.css';

const reportRetryDelayMs = 5 * 60 * 1000;

const SessionHistory = ({ user, onBack }) => {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState('');
  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [reportStatuses, setReportStatuses] = useState({});
  const pendingReports = useRef(new Set());

  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    async function generateStudentReport(student) {
      if (!student?.lastSessionId) return;
      const retryKey = `report-retry-${student.lastSessionId}`;
      const lastAttempt = Number(localStorage.getItem(retryKey) || 0);
      const remainingDelay = reportRetryDelayMs - (Date.now() - lastAttempt);
      if (remainingDelay > 0) {
        const remainingMinutes = Math.ceil(remainingDelay / 60000);
        setReportStatuses((statuses) => ({
          ...statuses,
          [student.studentId]: `הפקת הדוח נכשלה. ניסיון אוטומטי נוסף בעוד ${remainingMinutes} דקות.`
        }));
        return;
      }

      localStorage.setItem(retryKey, String(Date.now()));
      try {
        const response = await fetch(`${API_URL}/api/SessionRoutes/Sessions/${student.lastSessionId}/grade`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error('שרת הדירוג לא זמין או שעדיין לא הופעל מחדש.');
        }
        if (!response.ok || !data.report) {
          throw new Error(data.message || 'לא ניתן להפיק דוח.');
        }

        setStudents((currentStudents) => currentStudents.map((currentStudent) =>
          currentStudent.studentId === student.studentId
            ? { ...currentStudent, score: data.report?.score, report: data.report }
            : currentStudent
        ));
        localStorage.removeItem(retryKey);
        setReportStatuses((statuses) => ({ ...statuses, [student.studentId]: '' }));
      } catch (error) {
        setReportStatuses((statuses) => ({
          ...statuses,
          [student.studentId]: error instanceof Error ? error.message : 'לא ניתן להפיק דוח.'
        }));
      }
    }

    async function loadResults() {
      try {
        const isAdmin = user?.role === 'admin';
        const response = await fetch(
          isAdmin ? `${API_URL}/api/admin/reports` : `${API_URL}/api/StudentRoutes/summary`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'לא ניתן לטעון את התלמידים');
        }

        if (isAdmin) {
          setTeachers(Array.isArray(data) ? data : []);
        } else {
          setStudents(Array.isArray(data) ? data : []);
          const studentsNeedingReports = (Array.isArray(data) ? data : []).filter(
            (student) => !student.report && student.lastSessionId
          );
          if (studentsNeedingReports.length) {
            setReportStatuses(Object.fromEntries(
              studentsNeedingReports.map((student) => [student.studentId, 'מפיק ציון ומשוב...'])
            ));
            (async () => {
              for (const student of studentsNeedingReports) {
                if (pendingReports.current.has(student.lastSessionId)) continue;
                pendingReports.current.add(student.lastSessionId);
                try {
                  await generateStudentReport(student);
                } finally {
                  pendingReports.current.delete(student.lastSessionId);
                }
              }
            })();
          }
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'אירעה שגיאה בטעינת התלמידים'
        );
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [user?.role]);

  async function handleAddTeacher(event) {
    event.preventDefault();
    setFormMessage('');

    try {
      const response = await fetch(`${API_URL}/api/TeacherRoutes/teachers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          Teachername: teacherName,
          username: teacherUsername,
          password: teacherPassword
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'לא ניתן להוסיף מורה');

      setTeacherName('');
      setTeacherUsername('');
      setTeacherPassword('');
      setFormMessage('המורה נוספה בהצלחה.');

      const reportResponse = await fetch(`${API_URL}/api/admin/reports`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const report = await reportResponse.json();
      if (!reportResponse.ok) throw new Error(report.message || 'המורה נוספה, אך הרשימה לא התרעננה');
      setTeachers(Array.isArray(report) ? report : []);
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : 'אירעה שגיאה בהוספת מורה');
    }
  }

  return (
    <main className="session-history" dir="rtl">
      <header className="session-history-header">
        <h1>{user?.role === 'admin' ? 'מורות ותלמידים' : 'תוצאות תלמידים'}</h1>
        <button
          type="button"
          className="access-denied-back-button"
          onClick={onBack}
        >
          חזרה לכניסה
        </button>
      </header>

      {user?.role === 'admin' && (
        <section className="management-section">
          <h2>הוספת מורה</h2>
          <form className="management-form" onSubmit={handleAddTeacher}>
            <label>שם מלא<input value={teacherName} onChange={(event) => setTeacherName(event.target.value)} required /></label>
            <label>שם משתמש<input value={teacherUsername} onChange={(event) => setTeacherUsername(event.target.value)} required /></label>
            <label>סיסמה<input type="password" value={teacherPassword} onChange={(event) => setTeacherPassword(event.target.value)} minLength={8} required /></label>
            <button type="submit" className="button-end">הוספת מורה</button>
          </form>
          {formMessage && <p role="status">{formMessage}</p>}
        </section>
      )}

      {loading && <p>{user?.role === 'admin' ? 'טוען מורות ותלמידים...' : 'טוען תלמידים...'}</p>}
      {errorMessage && <p role="alert">{errorMessage}</p>}

      {!loading && !errorMessage && user?.role === 'admin' && teachers.length === 0 && (
        <p className="session-history-empty">אין עדיין מורות.</p>
      )}

      {!loading && !errorMessage && user?.role === 'admin' && teachers.map((teacher) => {
        const teacherStudents = Array.isArray(teacher?.students) ? teacher.students : [];
        return (
          <details className="teacher-group" key={teacher?._id || Math.random()}>
            <summary>{teacher?.Teachername || 'מורה'} <span>{teacherStudents.length} תלמידים</span></summary>
            {teacherStudents.length === 0 ? (
              <p className="session-history-empty">אין תלמידים תחת מורה זו.</p>
            ) : (
              <div className="session-history-table-wrap">
                <table className="session-history-table">
                  <thead><tr><th>שם התלמיד/ה</th><th>ציון</th><th>מבחנים שהושלמו</th><th>בחינה אחרונה</th></tr></thead>
                  <tbody>
                    {teacherStudents.map((student) => {
                      const sessions = Array.isArray(student?.sessions) ? student.sessions : [];
                      const completedSessions = sessions.filter((session) => session?.status === 'completed');
                      const lastSession = completedSessions.sort((first, second) => new Date(second?.completedAt || second?.startedAt || 0) - new Date(first?.completedAt || first?.startedAt || 0))[0];
                      const displayScore = lastSession?.report?.score ?? student?.score ?? 'אין ציון';
                      const displayDate = lastSession?.completedAt ? new Date(lastSession.completedAt).toLocaleDateString('he-IL') : 'אין בחינה';
                      return (
                        <tr key={student?._id || Math.random()}>
                          <td>{student?.Studentname || 'תלמיד/ה'}</td>
                          <td>{displayScore}</td>
                          <td>{completedSessions.length}</td>
                          <td>{displayDate}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </details>
        );
      })}

      {user?.role !== 'admin' && !loading && !errorMessage && students.length === 0 && (
        <p className="session-history-empty">לא נמצאו תלמידים.</p>
      )}

      {user?.role !== 'admin' && !loading && !errorMessage && students.length > 0 && (
        <div className="session-history-table-wrap">
          <table className="session-history-table">
            <thead>
              <tr>
                <th>שם התלמיד/ה</th>
                <th>ציון</th>
                <th>תאריך בחינה אחרון</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const safeReport = student?.report || {};
                const safeScore = safeReport.score ?? student?.score ?? 'אין ציון';
                const safeDate = student?.lastExamDate ? new Date(student.lastExamDate).toLocaleDateString('he-IL') : 'אין בחינה';

                return (
                  <tr key={student?.studentId || Math.random()}>
                    <td>
                      <details>
                        <summary>{student?.studentName || 'תלמיד/ה'}</summary>
                        {safeReport.explanation ? (
                          <section aria-label={`משוב עבור ${student?.studentName || 'תלמיד/ה'}`}>
                            <p>{safeReport.explanation}</p>
                            {Array.isArray(safeReport.improvements) && safeReport.improvements.length > 0 && (
                              <>
                                <h3>מה כדאי לשפר</h3>
                                <ul>
                                  {safeReport.improvements.map((item, index) => (
                                    <li key={`imp-${index}`}>{item}</li>
                                  ))}
                                </ul>
                              </>
                            )}
                            {safeReport.encouragement && <p>{safeReport.encouragement}</p>}
                            {Array.isArray(safeReport.items) && safeReport.items.map((item, index) => (
                              <p key={`item-${index}`}>
                                {item?.item || 'סעיף'}: {item?.accuracy ?? 0}%
                                {Array.isArray(item?.improvements) && item.improvements.length > 0 ? ` | ${item.improvements.join(', ')}` : ''}
                              </p>
                            ))}
                          </section>
                        ) : (
                          <p role="status">
                            {reportStatuses[student?.studentId] || 'לא נשמר דוח מפורט למבחן הזה.'}
                          </p>
                        )}
                      </details>
                    </td>
                    <td>{safeScore}</td>
                    <td>{safeDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
};

export default SessionHistory;