import { useState } from 'react';
import Login from './Login';
import WordToImage from './WordToImage';
import LettersBoard from './LettersBoard';
import CombosBoard from './CombosBoard';
import NonwordsBoard from './NonwordsBoard';
import SessionHistory from './SessionHistory';
import './App.css'

function App() {
  const [user, setUser] = useState(null);
  const [stage, useStage] = useState('word')
  const [completionError, setCompletionError] = useState('');

  function handleLogout() {
    localStorage.removeItem('accessToken');
    setUser(null);
  }

  async function handleCompleteExam() {
    setCompletionError('');

    try {
      const response = await fetch(
        `/api/SessionRoutes/Sessions/${user.sessionId}/complete`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'לא ניתן לסיים את המבחן');
      }

      setUser({ ...user, view: 'results' });
    } catch (error) {
      setCompletionError(
        error instanceof Error ? error.message : 'לא ניתן לסיים את המבחן'
      );
    }
  }

  if (!user) {
    return <Login onSuccess={setUser} />;
  }

  if (!['teacher', 'admin'].includes(user.role)) {
    return (
      <main dir="rtl">
        <p>המערכת מיועדת למורות בלבד.</p>
        <button className="button-end" onClick={handleLogout}>
          חזרה לכניסה
        </button>
      </main>
    );
  }

  if (user.view === 'results') {
    return <SessionHistory onBack={handleLogout} />;
  }

  return (
    <>
      {completionError && <p role="alert">{completionError}</p>}
      {stage == 'word' && (
        <WordToImage studentName={user.studentName}
          onComplate={() => useStage('letters')} />
      )}
      {stage === 'letters' && (
        <LettersBoard onComplete={() => useStage('combos')} />
      )}
      {stage == 'combos' && (
        <CombosBoard onComplete={() => useStage('nonwords')} />
      )}
      {/* {stage == 'nonwords' && <NonwordsBoard />} */}

      {stage === 'nonwords' && (
        <NonwordsBoard onComplete={handleCompleteExam} />
      )}

    </>


  )
}

export default App