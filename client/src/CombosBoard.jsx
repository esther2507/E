import React from 'react';
import { combosBoards } from '../../src/data/readingData';
import './CombosBoard.css';

export default function CombosBoard({ onComplete }) {
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
                    <button
                        type="button"
                        className="button-end"
                        onClick={onComplete}>
                        מעבר לשלב ג׳
                    </button>
            </div>
        </div>
    );
}
