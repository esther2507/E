import { useRef, useState } from 'react';
import './ReadingResponsePanel.css';

const allHebrewMarks = [
  { label: 'שווא', mark: '\u05B0' },
  { label: 'חטף סגול', mark: '\u05B1' },
  { label: 'חטף פתח', mark: '\u05B2' },
  { label: 'חטף קמץ', mark: '\u05B3' },
  { label: 'חיריק', mark: '\u05B4' },
  { label: 'צירה', mark: '\u05B5' },
  { label: 'סגול', mark: '\u05B6' },
  { label: 'פתח', mark: '\u05B7' },
  { label: 'קמץ', mark: '\u05B8' },
  { label: 'חולם', mark: '\u05B9' },
  { label: 'קובוץ', mark: '\u05BB' },
  { label: 'דגש', mark: '\u05BC' },
  { label: 'נקודת שי״ן', mark: '\u05C1' },
  { label: 'נקודת שי״ן שמאלית', mark: '\u05C2' },
];

const marksByPart = {
  combos: ['\u05B4', '\u05B5', '\u05B6', '\u05B7', '\u05B8', '\u05B9', '\u05BC', '\u05C1'],
  nonwords: ['\u05B0', '\u05B2', '\u05B4', '\u05B6', '\u05B7', '\u05B8', '\u05B9', '\u05BC', '\u05C1', '\u05C2'],
};

const ReadingResponsePanel = ({
  sessionId,
  part,
  boardName,
  itemIndex,
  itemText,
}) => {
  const [responseText, setResponseText] = useState('');
  const [evaluation, setEvaluation] = useState('');
  const [errorType, setErrorType] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [vowelErrorCount, setVowelErrorCount] = useState('1');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const responseInputRef = useRef(null);
  const showNikudButtons = part !== 'letters';
  const marksForPart = marksByPart[part];
  const hebrewMarks = marksForPart
    ? allHebrewMarks.filter(({ mark }) => marksForPart.includes(mark))
    : allHebrewMarks;

  function insertMark(mark) {
    const input = responseInputRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const insertionPoint = start === end ? start : end;
    const updatedText =
      responseText.slice(0, insertionPoint) +
      mark +
      responseText.slice(end);

    setResponseText(updatedText);
    setMessage('');
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(insertionPoint + mark.length, insertionPoint + mark.length);
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    const answer = responseText.trim();
    if (!answer) {
      setMessage('יש להזין את תשובת התלמיד/ה.');
      return;
    }

    if (!evaluation) {
      setMessage('יש לסמן אם התשובה מדויקת או שגויה.');
      return;
    }

    if (evaluation === 'error' && (!errorType || !errorDetails.trim())) {
      setMessage('בתשובה שגויה יש לבחור סוג טעות ולפרט אותה.');
      return;
    }

    const expectedVowels = (itemText.match(/[\u05B0-\u05BB]/g) || []).length;
    const vowelErrors = Number(vowelErrorCount);
    if (
      evaluation === 'error' &&
      errorType === 'vowel' &&
      (!Number.isInteger(vowelErrors) || vowelErrors < 1 || vowelErrors > expectedVowels)
    ) {
      setMessage('מספר טעויות התנועה חייב להיות בין 1 למספר התנועות בפריט.');
      return;
    }

    if (!sessionId) {
      setMessage('לא נמצא מפגש פעיל לשמירת התשובה.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/ItemResultRoutes/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          sessionId,
          part,
          boardName,
          itemIndex,
          itemText,
          responseText: answer,
          evaluation,
          errorType: evaluation === 'error' ? errorType : 'none',
          errorDetails: evaluation === 'error' ? errorDetails.trim() : '',
          vowelErrorCount: evaluation === 'error' && errorType === 'vowel' ? vowelErrors : 0,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'לא ניתן לשמור את התשובה.');
      }

      setMessage('התשובה וההערכה נשמרו.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'אירעה שגיאה בשמירת התשובה.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <aside className="reading-response-panel" dir="rtl">
      <h2>תשובת התלמיד/ה</h2>
      {itemText ? (
        <>
          <p className="reading-response-prompt">
            הפריט שנבחר: <strong>{itemText}</strong>
          </p>
          <form onSubmit={handleSubmit}>
            <label htmlFor="student-response">מה התלמיד/ה אמר/ה?</label>
            <textarea
              ref={responseInputRef}
              id="student-response"
              dir="rtl"
              value={responseText}
              onChange={(event) => setResponseText(event.target.value)}
              rows={3}
              required
            />
            <label htmlFor="response-evaluation">הערכת הקריאה:</label>
            <select
              id="response-evaluation"
              value={evaluation}
              onChange={(event) => {
                setEvaluation(event.target.value);
                setErrorType('');
                setErrorDetails('');
                setVowelErrorCount('1');
              }}
              required
            >
              <option value="">יש לבחור</option>
              <option value="accurate">מדויקת</option>
              <option value="error">שגויה</option>
            </select>
            {evaluation === 'error' && (
              <>
                <label htmlFor="response-error-type">סוג הטעות:</label>
                <select
                  id="response-error-type"
                  value={errorType}
                  onChange={(event) => setErrorType(event.target.value)}
                  required
                >
                  <option value="">יש לבחור</option>
                  <option value="vowel">בלבול תנועות</option>
                  <option value="auditory">בלבול שמיעתי</option>
                  <option value="visual">בלבול חזותי</option>
                  <option value="omission">השמטה</option>
                  <option value="addition">הוספה</option>
                  <option value="substitution">החלפה</option>
                  <option value="other">אחר</option>
                </select>
                {errorType === 'vowel' && (
                  <>
                    <label htmlFor="vowel-error-count">מספר טעויות התנועה בפריט:</label>
                    <input
                      id="vowel-error-count"
                      type="number"
                      min="1"
                      max={(itemText.match(/[\u05B0-\u05BB]/g) || []).length}
                      value={vowelErrorCount}
                      onChange={(event) => setVowelErrorCount(event.target.value)}
                      required
                    />
                  </>
                )}
                <label htmlFor="response-error-details">פירוט הטעות:</label>
                <textarea
                  id="response-error-details"
                  value={errorDetails}
                  onChange={(event) => setErrorDetails(event.target.value)}
                  maxLength={300}
                  rows={2}
                  required
                />
              </>
            )}
            {showNikudButtons && (
              <>
                <span className="reading-response-mark-label">הוספת ניקוד:</span>
                <div className="reading-response-mark-buttons">
                  {hebrewMarks.map(({ label, mark }) => (
                    <button
                      type="button"
                      className="reading-response-mark-button"
                      key={label}
                      title={label}
                      aria-label={`הוספת ${label}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => insertMark(mark)}
                    >
                      {'\u25CC'}{mark}
                    </button>
                  ))}
                </div>
              </>
            )}
            <button type="submit" disabled={isSaving}>
              {isSaving ? 'שומר...' : 'שמירת תשובה'}
            </button>
          </form>
          <p className="reading-response-note">
            ההערכה משמשת לחישוב המדדים. שטף לא מחושב עד שיוגדרו ספי דירוג מלאים.
          </p>
        </>
      ) : (
        <p>לחצו על אות או פריט בלוח כדי להזין את תשובת התלמיד/ה.</p>
      )}
      {message && <p className="reading-response-message" role="status">{message}</p>}
    </aside>
  );
};

export default ReadingResponsePanel;
