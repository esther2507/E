import React, { useState } from 'react';
import { lettersOrdered, lettersRandom } from '../../src/data/readingData';
import ReadingResponsePanel from './ReadingResponsePanel';
import './LettersBoard.css';

export default function LettersBoard({ onComplete, sessionId }) {
  const [boardType, setBoardType] = useState('ordered');
  const [selectedItem, setSelectedItem] = useState(null);
  const currentLetters = boardType === 'ordered' ? lettersOrdered : lettersRandom;
  const boardName = boardType === 'ordered' ? 'אותיות בסדר רגיל' : 'אותיות מעורבבות';

  return (
    <div className="board-container">
      <div className="reading-workspace">
        <div className="board-card">
          <h2 className="board-title">מבדק אבני יסוד - שלב אותיות</h2>

          <div className="board-select-container">
            <button
              onClick={() => {
                setBoardType('ordered');
                setSelectedItem(null);
              }}
              className={`mode-btn ${boardType === 'ordered' ? 'active' : ''}`}
            >
              אותיות בסדר רגיל
            </button>
            <button
              onClick={() => {
                setBoardType('random');
                setSelectedItem(null);
              }}
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
            {currentLetters.map((item, index) => {
              const isSelected = selectedItem?.itemIndex === index;
              return (
                <button
                  type="button"
                  key={index}
                  className={`word-box letter-box${isSelected ? ' selected' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedItem({ itemIndex: index, itemText: item });
                  }}
                >
                  {item}
                </button>
              );
            })}
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
        <ReadingResponsePanel
          key={`${boardType}-${selectedItem?.itemIndex ?? 'none'}`}
          sessionId={sessionId}
          part="letters"
          boardName={boardName}
          itemIndex={selectedItem?.itemIndex}
          itemText={selectedItem?.itemText}
        />
      </div>
    </div>
  );
}