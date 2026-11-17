import React from 'react';
import { combosBoards } from '../../src/data/readingData';
import { useState } from 'react';
import ReadingResponsePanel from './ReadingResponsePanel';
import './CombosBoard.css';

export default function CombosBoard({ onComplete, sessionId }) {
    const [selectedItem, setSelectedItem] = useState(null);

    return (
        <div className="board-container">
            <div className="reading-workspace">
                <div className="board-card">
                    <h2 className="board-title">מבדק אבני יסוד - שלב צירופים</h2>
                    <p className="board-instruction">קרא את הצירופים הבאים בעיון (דגש על דיוק בניקוד: צירה, סגול וכדומה):</p>

                    {combosBoards.map((board, boardIndex) => (
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
                                            })}>
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
                        onClick={onComplete}>
                        מעבר לשלב ג׳
                    </button>
                </div>
                <ReadingResponsePanel
                    key={`${selectedItem?.boardName ?? 'none'}-${selectedItem?.itemIndex ?? 'none'}`}
                    sessionId={sessionId}
                    part="combos"
                    boardName={selectedItem?.boardName}
                    itemIndex={selectedItem?.itemIndex}
                    itemText={selectedItem?.itemText}
                />
            </div>
        </div>
    );
}
