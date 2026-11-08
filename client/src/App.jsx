import { useState } from 'react';
import Login from './Login';
import WordToImage from './WordToImage';

function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <Login onSuccess={setUser} />;
  }

  if (user.role === 'admin') {
    return (
      <main dir="rtl">
        <h1>שלום, מנהל/ת</h1>
        <p>ההתחברות כמנהל הצליחה. בשלב הבא נוסיף כאן ניהול מורות.</p>
      </main>
    );
  }

  return <WordToImage />;
}

export default App;