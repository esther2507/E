import React from 'react';
import { nonwordsBoards } from '../../src/data/readingData';
import './NonwordsBoard.css';

export default function NonwordsBoard() {
  return (
    <div className="board-container">
      <div className="board-card">
        <h2 className="board-title">מבדק אבני יסוד - שלב מילות תפל</h2>
        <p className="board-instruction">קרא את מילות התפל הבאות בדייקנות:</p>

        {nonwordsBoards.map((board, boardIndex) => (
          <div key={board.id || boardIndex} className="sub-board-section">
            <h3 className="board-subtitle">{board.name}</h3>
            <div className="words-grid">
              {board.items.map((item, index) => (
                <div key={index} className="word-box">
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
