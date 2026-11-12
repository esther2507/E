import { useEffect, useState } from 'react';
import './SessionHistory.css';

const SessionHistory = ({ user, onBack }) => {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState('');
  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [formMessage, setFormMessage] = useState('');

  useEffect(() => {
    async function loadResults() {
      try {
        const isAdmin = user?.role === 'admin';
        const response = await fetch(
          isAdmin ? '/api/admin/reports' : '/api/StudentRoutes/summary',
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
          setTeachers(data);
        } else {
          setStudents(data);
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
      const response = await fetch('/api/TeacherRoutes/teachers', {
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

      const reportResponse = await fetch('/api/admin/reports', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const report = await reportResponse.json();
      if (!reportResponse.ok) throw new Error(report.message || 'המורה נוספה, אך הרשימה לא התרעננה');
      setTeachers(report);
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

      {!loading && !errorMessage && user?.role === 'admin' && teachers.map((teacher) => (
        <details className="teacher-group" key={teacher._id}>
          <summary>{teacher.Teachername} <span>{teacher.students.length} תלמידים</span></summary>
          {teacher.students.length === 0 ? (
            <p className="session-history-empty">אין תלמידים תחת מורה זו.</p>
          ) : (
            <div className="session-history-table-wrap">
              <table className="session-history-table">
                <thead><tr><th>שם התלמיד/ה</th><th>ציון</th><th>מבחנים שהושלמו</th><th>בחינה אחרונה</th></tr></thead>
                <tbody>
                  {teacher.students.map((student) => {
                    const completedSessions = student.sessions.filter((session) => session.status === 'completed');
                    const lastSession = completedSessions.sort((first, second) => new Date(second.completedAt || second.startedAt) - new Date(first.completedAt || first.startedAt))[0];
                    return (
                      <tr key={student._id}>
                        <td>{student.Studentname}</td>
                        <td>{student.score ?? 'אין ציון'}</td>
                        <td>{completedSessions.length}</td>
                        <td>{lastSession?.completedAt ? new Date(lastSession.completedAt).toLocaleDateString('he-IL') : 'אין בחינה'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </details>
      ))}

      {user?.role !== 'admin' && !loading && !errorMessage && students.length === 0 && (
        <p className="session-history-empty">לא נמצאו תלמידים.</p>
      )}

      {user?.role !== 'admin' && !loading && !errorMessage && students.length > 0 && (
        <div className="session-history-table-wrap">
          <table className="session-history-table">
            <thead>
              <tr>
                <th>שם התלמיד/ה</th>
                {/* <th>גיל</th> */}
                <th>ציון</th>
                <th>תאריך בחינה אחרון</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.studentId}>
                  <td>{student.studentName}</td>
                  <td>{student.score ?? 'אין ציון'}</td>
                  <td>
                    {student.lastExamDate
                      ? new Date(student.lastExamDate).toLocaleDateString('he-IL')
                      : 'אין בחינה'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
};

export default SessionHistory;