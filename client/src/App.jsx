import { useState } from 'react';
import Login from './Login';
import WordToImage from './WordToImage';
import LettersBoard from './LettersBoard';
import CombosBoard from './CombosBoard';
import NonwordsBoard from './NonwordsBoard';
import './App.css'

function App() {
  const [user, setUser] = useState(null);
  const [stage, useStage] = useState('word')

  function handleLogout() {
    sessionStorage.removeItem('accessToken');
    setUser(null);
  }

  if (!user) {
    return <Login onSuccess={setUser} />;
  }

  if (!['teacher', 'admin'].includes(user.role)) {
    return (
      <main dir="rtl">
        <p>המערכת מיועדת למורות בלבד.</p>
        <button onClick={handleLogout}>חזרה לכניסה</button>
      </main>
    );
  }

  return (
    <>
      {stage == 'word' && (
        <WordToImage studentName={user.studentName}
          onComplate={() => useStage('letters')} />
      )}
      {stage === 'letters' && (
        <LettersBoard onComplete={() => useStage('combos')} />
      )}
      {stage == 'combos' &&(
        <CombosBoard onComplete={() => useStage('nonwords')} /> 
      )}
      {stage == 'nonwords' && <NonwordsBoard />}

    </>

  )
}

export default App