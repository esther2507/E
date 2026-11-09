import React, { useState } from 'react';
import { lettersOrdered, lettersRandom } from '../../src/data/readingData';
import './LettersBoard.css';

export default function LettersBoard({ onComplete }) {
  const [boardType, setBoardType] = useState('ordered');
  const currentLetters =
    boardType === 'ordered' ? lettersOrdered : lettersRandom;

  return (
    <div className="board-container">
      <div className="board-card">
        <h2 className="board-title">מבדק אבני יסוד - שלב אותיות</h2>

        <div className="board-select-container">
          <button
            onClick={() => setBoardType('ordered')}
            className={`mode-btn ${boardType === 'ordered' ? 'active' : ''}`}
          >
            אותיות בסדר רגיל
          </button>
          <button
            onClick={() => setBoardType('random')}
            className={`mode-btn ${boardType === 'random' ? 'active' : ''}`}
          >
            אותיות מעורבבות
          </button>
        </div>

        <h3 className="board-subtitle">
          {boardType === 'ordered'
            ? 'לוח אותיות בסדר עולה'
            : 'לוח אותיות במערך אקראי'}
        </h3>

        <div className="words-grid letters-grid-layout">
          {currentLetters.map((item, index) => (
            <div key={index} className="word-box letter-box">
              {item}
            </div>
          ))}
        </div>

        {boardType === 'random' && (
          <button
            type="button"
            className="button-end"
            onClick={onComplete}
          >
            מעבר לשלב ב׳
          </button>
        )}
      </div>
    </div>
  );
}