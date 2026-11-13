import React from 'react';
import { useState } from 'react';
import { nonwordsBoards } from '../../src/data/readingData';
import ReadingResponsePanel from './ReadingResponsePanel';
import './NonwordsBoard.css';

export default function NonwordsBoard({ onComplete, sessionId }) {
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <div className="board-container">
      <div className="reading-workspace">
        <div className="board-card">
          <h2 className="board-title">מבדק אבני יסוד - שלב מילות תפל</h2>
          <p className="board-instruction">קרא את מילות התפל הבאות בדייקנות:</p>

          {nonwordsBoards.map((board, boardIndex) => (
            <div key={board.id || boardIndex} className="sub-board-section">
              <h3 className="board-subtitle">{board.name}</h3>
              <div className="words-grid">
                {board.items.map((item, index) => {
                  const boardName = board.name;
                  const isSelected = selectedItem?.boardName === boardName &&
                    selectedItem?.itemIndex === index;
                  return (
                    <button
                      type="button"
                      key={index}
                      className={`word-box${isSelected ? ' selected' : ''}`}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedItem({
                        boardName,
                        itemIndex: index,
                        itemText: item,
                      })}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            type="button"
            className="button-end"
            onClick={onComplete}
          >
            סיום מבחן
          </button>
        </div>
        <ReadingResponsePanel
          key={`${selectedItem?.boardName ?? 'none'}-${selectedItem?.itemIndex ?? 'none'}`}
          sessionId={sessionId}
          part="nonwords"
          boardName={selectedItem?.boardName}
          itemIndex={selectedItem?.itemIndex}
          itemText={selectedItem?.itemText}
        />
      </div>
    </div>
  );
}