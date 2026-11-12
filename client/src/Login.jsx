import React, { useState } from 'react';
import './Login.css';

const Login = ({ onSuccess }) => {
  const [teacherUsername, setTeacherUsername] = useState('');
  const [password, setPassword] = useState('');
  const [studentName, setStudentName] = useState('');
  const [authenticatedAdmin, setAuthenticatedAdmin] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e, view = 'activity') => {
    e?.preventDefault();
    setErrorMessage('');

    try {
      if (authenticatedAdmin) {
        onSuccess({ ...authenticatedAdmin, view: 'admin' });
        return;
      }

      const loginResponse = await fetch('/api/TeacherRoutes/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: teacherUsername,
          password,
        }),
      });

      const data = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(data.message || 'התחברות נכשלה');
      }

      if (!data.accessToken) {
        throw new Error('לא התקבל אסימון התחברות מהשרת');
      }

      localStorage.setItem('accessToken', data.accessToken);

      if (data.teacher.role === 'admin') {
        setAuthenticatedAdmin(data.teacher);
        return;
      }

      if (view === 'results') {
        onSuccess({ ...data.teacher, view });
        return;
      }

      if (!studentName.trim()) {
        throw new Error('יש להזין שם תלמיד/ה');
      }

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.accessToken}`,
      };

      const studentResponse = await fetch('/api/StudentRoutes', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          Studentname: studentName.trim(),
          organization: 'לא צוין',
        }),
      });

      const student = await studentResponse.json();
      if (!studentResponse.ok) {
        throw new Error(student.message || 'יצירת תלמיד נכשלה');
      }

      const sessionResponse = await fetch('/api/SessionRoutes/Sessions', {
        method: 'POST',
        headers,
        body: JSON.stringify({ studentId: student._id }),
      });

      const sessionData = await sessionResponse.json();
      if (!sessionResponse.ok) {
        throw new Error(sessionData.message || 'פתיחת מפגש נכשלה');
      }

      onSuccess({
        ...data.teacher,
        studentName,
        view,
        studentId: student._id,
        sessionId: sessionData.session._id,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'אירעה שגיאה בהתחברות'
      );
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <div className="login-welcome-header">
          <div className="icon-wrapper">📖</div>
          <h1>בואו נתחיל לקרוא!</h1>
          <p className="welcome-instructions">
            כתבו את שמכם, ואז ענו על השאלות לפי מה שאתם קוראים ורואים בתמונות.
          </p>
        </div>

        <div className="teacher-credentials-section">
          <div className="form-group">
            <label htmlFor="teacherUsername">שם המורה:</label>
            <input
              type="text"
              id="teacherUsername"
              placeholder="שם מורה"
              value={teacherUsername}
              onChange={(e) => setTeacherUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">סיסמה:</label>
            <input
              type="password"
              id="password"
              placeholder="סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="student-input-section">
          <div className="form-group student-field">
            <label htmlFor="studentName">שם התלמיד/ה:</label>
            <input
              type="text"
              id="studentName"
              placeholder="השם שלי הוא..."
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              disabled={Boolean(authenticatedAdmin)}
            />
          </div>
        </div>

        <button type="submit" className="login-button">
          {authenticatedAdmin ? 'כניסה לניהול' : 'התחל פעילות'}
        </button>

        <button
          type="button"
          className="show-result"
          onClick={() => handleLogin(null, 'results')}
          disabled={Boolean(authenticatedAdmin)}
        >
          לצפייה בתוצאות
        </button>

        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </form>
    </div>
  );
};

export default Login;