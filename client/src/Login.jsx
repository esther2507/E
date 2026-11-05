import React, { useState } from 'react';
import './Login.css';

const Login = () => {
    const [teacherUsername, setTeacherUsername] = useState('');
    const [password, setPassword] = useState('');

    const [studentName, setStudentName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: teacherUsername,
                    password: password,
                    studentName: studentName
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'התחברות נכשלה');
            }

            sessionStorage.setItem('accessToken', data.accessToken);
            setSuccessMessage('התחברת בהצלחה!');
        } catch (error) {
            setErrorMessage(error.message);
            console.error('Error logging in:', error);
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

                <button type="submit" className="login-button">התחל פעילות</button>

                {errorMessage && <p className="error-message">{errorMessage}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}
            </form>
        </div>
    );
};

export default Login;