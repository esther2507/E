import React from 'react';
import { combosBoards } from './data/readingData';
import './CombosBoard.css';

export default function CombosBoard() {
  return (
    <div className="board-container">
      <div className="board-card">
        <h2 className="board-title">מבדק אבני יסוד - שלב צירופים</h2>
        <p className="board-instruction">קרא את הצירופים הבאים בעיון (דגש על דיוק בניקוד: צירה, סגול וכדומה):</p>

        {combosBoards.map((board, boardIndex) => (
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