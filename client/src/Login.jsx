import React, { useState } from 'react';
import './Login.css';

const Login = ({ onSuccess }) => {
  const [teacherUsername, setTeacherUsername] = useState('');
  const [password, setPassword] = useState('');
  const [studentName, setStudentName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: teacherUsername,
          password,
          studentName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'התחברות נכשלה');
      }

      if (!data.accessToken) {
        throw new Error('לא התקבל אסימון התחברות מהשרת');
      }

      sessionStorage.setItem('accessToken', data.accessToken);
      onSuccess({ ...data.teacher, studentName });
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
              required
            />
          </div>
        </div>

        <button type="submit" className="login-button">
          התחל פעילות
        </button>

        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </form>
    </div>
  );
};

export default Login;