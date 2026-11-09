import { useState } from 'react';
import Login from './Login';
import WordToImage from './WordToImage';

function App() {
  const [user, setUser] = useState(null);

  function handleLogout() {
    sessionStorage.removeItem('accessToken');
    setUser(null);
  }

  if (!user) {
    return <Login onSuccess={setUser} />;
  }

  if (user.role !== 'teacher') {
    return (
      <main dir="rtl">
        <p>המערכת מיועדת למורות בלבד.</p>
        <button onClick={handleLogout}>חזרה לכניסה</button>
      </main>
    );
  }

  return (
    <WordToImage studentName={user.studentName} />
    
  )
}

export default App;