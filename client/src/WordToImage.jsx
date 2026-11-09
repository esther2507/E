import React, { useEffect, useState } from 'react';
import image from './assets/shulamit/image1.png'
import image2 from './assets/shulamit/image2.png'
import image3 from './assets/shulamit/image3.png'
import image4 from './assets/child/image4.png'
import image5 from './assets/child/image5.png'
import image6 from './assets/child/image6.png'
import image7 from './assets/girl/image7.png'
import image8 from './assets/girl/image8.png'
import image9 from './assets/girl/image9.png'
import image10 from './assets/bicycle/image10.png'
import image11 from './assets/bicycle/image11.png'
import image12 from './assets/bicycle/image12.png'
import image13 from './assets/picturesque/image13.png'
import image14 from './assets/picturesque/image14.png'
import image15 from './assets/picturesque/image15.png'
import image16 from './assets/spoon/image16.png'
import image17 from './assets/spoon/image17.png'
import image18 from './assets/spoon/image18.png'
import image19 from './assets/sheep/image19.png'
import image20 from './assets/sheep/image19.png'
import image21 from './assets/sheep/image19.png'
import image22 from './assets/chair/image22.png'
import image23 from './assets/chair/image23.png'
import image24 from './assets/chair/image24.png'

import './WordToImage.css';

const WordToImage = ({ onComplate }) => {
    // const [saveError, setSaveError] = useState('');
    // const [isSaving, setIsSaving] = useState(false);
    const groups = [
        {
            groupName: "משפטים פשוטים (שלב א')",
            questions: [
                {
                    id: 1,
                    sentence: "שׁוּלַמִּית מְצַיֶּרֶת בַּיִת",
                    options: [
                        { id: 1, imageSrc: image, isCorrect: false },
                        { id: 2, imageSrc: image2, isCorrect: false },
                        { id: 3, imageSrc: image3, isCorrect: true }
                    ]
                },
                {
                    id: 2,
                    sentence: "שִׁמְעוֹן נָהַג בַּמְּכוֹנִית הָאֲדֻמָּה",
                    options: [
                        { id: 1, imageSrc: image4, isCorrect: true },
                        { id: 2, imageSrc: image5, isCorrect: false },
                        { id: 3, imageSrc: image6, isCorrect: false }
                    ]
                },
                {
                    id: 3,
                    sentence: "דְּבוֹרָה סָגְרָה אֶת הַחַלּוֹן",
                    options: [
                        { id: 1, imageSrc: image7, isCorrect: true },
                        { id: 2, imageSrc: image8, isCorrect: false },
                        { id: 3, imageSrc: image9, isCorrect: false }
                    ]
                }
            ]
        },
        {
            groupName: "משפטים מורכבים (שלב ב' - קבוצה שניה)",
            questions: [
                {
                    id: 4,
                    sentence: "שׁוּקִי רָכַב עַל הָאוֹפַנַּיִם",
                    options: [
                        { id: 1, imageSrc: image10, isCorrect: false },
                        { id: 2, imageSrc: image11, isCorrect: true },
                        { id: 3, imageSrc: image12, isCorrect: false }
                    ]
                },
                {
                    id: 5,
                    imageSrc: image13,
                    options: [
                        { id: 1, sentence: "אִמָּא מְשַׂחֶקֶת עִם מוֹיְשִׁי וּמְסַפֶּרֶת לוֹ סִפּוּר", isCorrect: false },
                        { id: 2, sentence: "אִמָּא מַאֲכִילָה אֶת מוֹיְשִׁי וּמְסַפֶּרֶת לוֹ סִפּוּר", isCorrect: true },
                        { id: 3, sentence: "אִמָּא מַלְבִּישָׁה אֶת מוֹיְשִׁי וּמְסַפֶּרֶת לוֹ סִפּוּר", isCorrect: false }
                    ]
                },
                {
                    id: 6,
                    imageSrc: image14,
                    options: [
                        { id: 1, sentence: "הַיְּלָדִים יָצְאוּ לַחֲצֵר וְשִׂחֲקוּ מַחֲבֹאִים", isCorrect: false },
                        { id: 2, sentence: "הַיְּלָדִים יָצְאוּ לַחֲצֵר וְשִׂחֲקוּ בְּכַדּוּר", isCorrect: false },
                        { id: 3, sentence: "הַיְּלָדִים טִפְּסוּ עַל הָעֵץ כְּדֵי לְהוֹרִיד אֶת הַכַּדּוּר", isCorrect: true }
                    ]
                },
                {
                    id: 7,
                    imageSrc: image15,
                    options: [
                        { id: 1, sentence: "גֶּשֶׁם יוֹרֵד וְהַיְּלָדִים מִסְתַּתְּרִים מִתַּחַת לְתַחֲנָה", isCorrect: false },
                        { id: 2, sentence: "גֶּשֶׁם יוֹרֵד וְהַיְּלָדִים מִסְתַּתְּרִים לְיַד הַמִּטְרִיָּה   ", isCorrect: false },
                        { id: 3, sentence: "גֶּשֶׁם יוֹרֵד וְהַיְּלָדִים מִסְתַּתְּרִים מִתַּחַת לְמִטְרִיָּה", isCorrect: true }
                    ]
                },
            ]
        },
        {
            groupName: "(שלב ג' - קבוצה שלישית) הוראות פשוטות",
            questions: [
                {
                    id: 8,
                    sentence: "סַמֵּן אֶת הַכַּף הַבֵּינוֹנִית",
                    options: [
                        { id: 1, imageSrc: image16, isCorrect: false },
                        { id: 2, imageSrc: image17, isCorrect: false },
                        { id: 3, imageSrc: image18, isCorrect: true }
                    ]
                },
                {
                    id: 9,
                    sentence: "סַמֵּן אֶת הַכִּבְשָׂה הַגְּבוֹהָה",
                    options: [
                        { id: 1, imageSrc: image19, isCorrect: false },
                        { id: 2, imageSrc: image20, isCorrect: true },
                        { id: 3, imageSrc: image21, isCorrect: false }
                    ]
                },
                {
                    id: 9,
                    sentence: "סַמֵּן אֶת הַכִּסֵּא הַקָּטָן",
                    options: [
                        { id: 1, imageSrc: image22, isCorrect: false },
                        { id: 2, imageSrc: image23, isCorrect: true },
                        { id: 3, imageSrc: image24, isCorrect: false }
                    ]
                }
            ]
        },
    ];

    const [currentGroupIndex, setCurrentGroupIndex] = useState(() => {
        const savedGroup = localStorage.getItem('currentGroupIndex');
        const parsed = savedGroup !== null ? parseInt(savedGroup, 10) : 0;
        return (parsed >= 0 && parsed < groups.length) ? parsed : 0;
    });

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
        const savedIndex = localStorage.getItem('currentQuestionIndex');
        const parsed = savedIndex !== null ? parseInt(savedIndex, 10) : 0;
        return parsed >= 0 ? parsed : 0;
    });

    const [selectedOptionId, setSelectedOptionId] = useState(null);
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

    useEffect(() => {
        localStorage.setItem('currentGroupIndex', currentGroupIndex);
        localStorage.setItem('currentQuestionIndex', currentQuestionIndex);
    }, [currentGroupIndex, currentQuestionIndex]);

    const activeGroup = groups[currentGroupIndex] || groups[0];
    const currentQuestion = activeGroup.questions[currentQuestionIndex] || activeGroup.questions[0];

    const handleSelect = (option) => {
        if (isAnswerSubmitted) return;

        setSelectedOptionId(option.id);
        setIsAnswerSubmitted(true);

        setTimeout(() => {
            if (currentQuestionIndex + 1 < activeGroup.questions.length) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            } else if (currentGroupIndex + 1 < groups.length) {
                setCurrentGroupIndex(currentGroupIndex + 1);
                setCurrentQuestionIndex(0);
            } else {
                onComplate()
                return
            }

            setSelectedOptionId(null);
            setIsAnswerSubmitted(false);
        }, 1000);
    };

const hasSentenceOnTop = Boolean(currentQuestion.sentence);

return (
    <div className="test-page-container">
        <div className="test-main-card">
            <h2 className="main-title">מבדק קריאה אישי</h2>

            <div className="sentence-box">
                <span className="state-badge">
                    {activeGroup.groupName} · שאלה {currentQuestionIndex + 1} מתוך {activeGroup.questions.length}
                </span>

                {hasSentenceOnTop ? (
                    <h1 className="sentence-text">{currentQuestion.sentence}</h1>
                ) : (
                    <div
                        className="main-image-container"
                        style={{
                            width: '300px',
                            height: '200px',
                            margin: '15px auto 0 auto',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '2px solid #e2e8f0'
                        }}
                    >
                        <img
                            src={currentQuestion.imageSrc}
                            alt="שאלה ראשית"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                )}
            </div>

            <div
                className={hasSentenceOnTop ? "images-grid" : "sentences-grid"}
                style={{
                    display: 'flex',
                    flexDirection: hasSentenceOnTop ? 'row' : 'column',
                    gap: '15px',
                    justifyContent: 'center'
                }}
            >
                {currentQuestion.options.map((option) => {
                    let cardClassName = hasSentenceOnTop
                        ? "image-card"
                        : "sentence-option-card";

                    if (isAnswerSubmitted) {
                        if (option.id === selectedOptionId) {
                            cardClassName += option.isCorrect ? " correct" : " incorrect";
                        } else if (option.isCorrect) {
                            cardClassName += " correct";
                        }
                    }

                    return (
                        <div
                            key={option.id}
                            className={cardClassName}
                            onClick={() => handleSelect(option)}
                            style={!hasSentenceOnTop ? {
                                padding: '16px 20px',
                                borderRadius: '16px',
                                border: '2px solid #e2e8f0',
                                backgroundColor: '#ffffff',
                                cursor: 'pointer',
                                position: 'relative',
                                textAlign: 'center',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
                            } : {}}
                        >
                            {hasSentenceOnTop ? (
                                <div className="image-frame">
                                    <img src={option.imageSrc} alt="אפשרות בחירה" />
                                </div>
                            ) : (
                                <span style={{
                                    fontSize: '20px',
                                    fontWeight: '700',
                                    color: '#1e293b'
                                }}>
                                    {option.sentence}
                                </span>
                            )}

                            {isAnswerSubmitted && option.id === selectedOptionId && (
                                <div
                                    className="feedback-badge"
                                    style={!hasSentenceOnTop ? {
                                        position: 'absolute',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        left: '15px'
                                    } : {}}
                                >
                                    {option.isCorrect ? "⭐" : "✕"}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
);
};

export default WordToImage;