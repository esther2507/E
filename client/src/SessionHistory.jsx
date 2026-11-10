import { useEffect, useState } from 'react';
import './SessionHistory.css';

const SessionHistory = ({ onBack }) => {
  const [students, setStudents] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudents() {
      try {
        const response = await fetch('/api/StudentRoutes/summary', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'לא ניתן לטעון את התלמידים');
        }

        setStudents(data);
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

    loadStudents();
  }, []);

  return (
    <main className="session-history" dir="rtl">
      <header className="session-history-header">
        <h1>תוצאות תלמידים</h1>
        <button
          type="button"
          className="access-denied-back-button"
          onClick={onBack}
        >
          חזרה לכניסה
        </button>
      </header>

      {loading && <p>טוען תלמידים...</p>}
      {errorMessage && <p role="alert">{errorMessage}</p>}

      {!loading && !errorMessage && students.length === 0 && (
        <p className="session-history-empty">לא נמצאו תלמידים.</p>
      )}

      {!loading && !errorMessage && students.length > 0 && (
        <div className="session-history-table-wrap">
          <table className="session-history-table">
            <thead>
              <tr>
                <th>שם התלמיד/ה</th>
                <th>גיל</th>
                <th>ציון</th>
                <th>תאריך בחינה אחרון</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.studentId}>
                  <td>{student.studentName}</td>
                  <td>{student.age ?? 'לא צוין'}</td>
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