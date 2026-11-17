const { GoogleGenAI } = require("@google/genai");
const { ReadingResponse, ItemResult, Session } = require("../models/readingModel");

const answerKey = {
    "0:1": 3,
    "0:2": 1,
    "0:3": 1,
    "1:4": 2,
    "1:5": 2,
    "1:6": 3,
    "1:7": 3,
    "2:8": 1,
    "2:9": 2,
    "2:10": 2
};

const boardWeights = {
    "אותיות בסדר רגיל": 1,
    "אותיות מעורבבות": 2,
    combos: 3,
    nonwords: 4
};

function calculateWeightedScore(items) {
    const weightedPoints = items.reduce((total, item) => {
        const weight = boardWeights[item.boardName] || boardWeights[item.part] || 1;
        return total + item.accuracy * weight;
    }, 0);
    const totalWeight = items.reduce((total, item) => {
        return total + (boardWeights[item.boardName] || boardWeights[item.part] || 1);
    }, 0);

    return totalWeight ? Math.round(weightedPoints / totalWeight) : null;
}

async function getAiReadingFeedback(responses, imageItems) {
    if (!process.env.GEMINI_API_KEY) {
        const error = new Error("GEMINI_API_KEY is not configured");
        error.statusCode = 503;
        throw error;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const payload = responses.map((response) => ({
        part: response.part,
        board: response.boardName,
        target: response.itemText,
        studentResponse: response.responseText
    }));

    const systemInstruction = "את/ה מומחה/ית להערכת קריאה בעברית עבור תלמידים. השווה בין פריט היעד לבין התשובה שנרשמה. התייחס בנפרד לדיוק אותיות (כולל בלבולים בעלי דמיון חזותי או צלילי), ניקוד, השמטות, הוספות וסדר. הבחֵן בין חומרת בלבולים שונים; למשל החלפה שמשנה צליל/משמעות צריכה לקבל משקל שונה משגיאת ניקוד או בלבול בין אותיות דומות. אין להמציא שגיאות כאשר התשובה מתאימה. קבע לכל פריט accuracy בין 0 ל-100; שגיאת ניקוד בלבד צריכה להיות קלה יותר משינוי אות שמשנה את המילה. התחשב גם בסיכום הצלחה/קושי בשאלות התמונות בעת כתיבת העידוד הכללי, אך אל תשנה את ציוני התמונות. החזר JSON בלבד במבנה: {\"items\":[{\"accuracy\":number,\"strengths\":[string],\"improvements\":[string],\"encouragement\":string}],\"explanation\":string,\"improvements\":[string],\"encouragement\":string}. כתוב בעברית מכבדת ומעודדת, בלי אבחנות רפואיות.";

    const userContent = JSON.stringify({
        readingItems: payload,
        imageSummary: imageItems.map(({ item, accuracy }) => ({ item, accuracy }))
    });

    let response;
    try {
        response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
            contents: userContent,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json"
            }
        });
    } catch (err) {
        const safeMessage = String(err.message || "Gemini API error")
            .replaceAll(process.env.GEMINI_API_KEY, "[REDACTED]")
            .slice(0, 300);
        const error = new Error(safeMessage);
        error.upstreamStatus = err.status || 502;
        error.statusCode = 502;
        throw error;
    }

    const text = response.text;
    const parsed = JSON.parse(text || "{}");
    if (!Array.isArray(parsed.items) || parsed.items.length !== responses.length) {
        throw new Error("AI grading response did not match submitted items");
    }

    const readingItems = responses.map((item, index) => ({
        part: item.part,
        boardName: item.boardName,
        item: item.itemText,
        response: item.responseText,
        accuracy: Math.max(0, Math.min(100, Number(parsed.items[index].accuracy) || 0)),
        strengths: Array.isArray(parsed.items[index].strengths) ? parsed.items[index].strengths : [],
        improvements: Array.isArray(parsed.items[index].improvements) ? parsed.items[index].improvements : [],
        encouragement: String(parsed.items[index].encouragement || "כל הכבוד על המאמץ!")
    }));

    const score = calculateWeightedScore(readingItems);
    return {
        score,
        explanation: String(parsed.explanation || "הציון משקף את מידת הדיוק בתשובות שנבדקו."),
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
        encouragement: String(parsed.encouragement || "המשך/י להתאמן, כל קריאה מקדמת אותך!"),
        readingItems,
        aiGenerated: true
    };
}

async function gradeSession(sessionId, examinerId) {
    let session = await Session.findById(sessionId);
    if (!session && examinerId) {
        session = await Session.findOne({ _id: sessionId, examinerId });
    }
    if (!session) return null;

    const [imageAnswers, savedReadingResponses] = await Promise.all([
        ItemResult.find({ sessionId }).sort({ createdAt: 1 }).lean(),
        ReadingResponse.find({ sessionId }).sort({ createdAt: 1 }).lean()
    ]);
    
    const latestResponses = new Map();
    for (const response of savedReadingResponses) {
        latestResponses.set(`${response.part}:${response.boardName}:${response.itemIndex}`, response);
    }
    const readingResponses = [...latestResponses.values()];
    
    const imageItems = imageAnswers.map((answer) => {
        const expected = answerKey[`${answer.questionGroup}:${answer.questionId}`];
        return {
            part: "wordToImage",
            item: `קבוצה ${answer.questionGroup}, שאלה ${answer.questionId}`,
            response: answer.selectedValue || `אפשרות ${answer.selectedOptionId}`,
            accuracy: expected === undefined ? 0 : (answer.selectedOptionId === expected ? 100 : 0),
            strengths: expected !== undefined && answer.selectedOptionId === expected ? ["בחירה נכונה"] : [],
            improvements: expected === undefined ? ["לא הוגדר מפתח תשובה לשאלה זו"] : (answer.selectedOptionId === expected ? [] : ["כדאי לחזור על הבנת ההוראה או המשפט"]),
            encouragement: answer.selectedOptionId === expected ? "בחירה מצוינת!" : "טעות היא הזדמנות ללמוד, נמשיך לנסות!"
        };
    });

    let readingFeedback = {
        score: null,
        explanation: "לא נשמרו תשובות קריאה לבדיקה.",
        improvements: [],
        encouragement: "כל הכבוד על ההשתתפות!",
        readingItems: [],
        aiGenerated: false
    };
    
    if (readingResponses.length) {
        readingFeedback = await getAiReadingFeedback(readingResponses, imageItems);
    }

    const items = [
        ...imageItems.map((item) => ({ ...item, boardName: "wordToImage" })),
        ...readingFeedback.readingItems
    ];
    
    const score = calculateWeightedScore(items);
    
    const report = {
        score,
        explanation: readingResponses.length
            ? readingFeedback.explanation
            : "הציון מבוסס על תשובות התלמיד/ה בתרגילי התמונות.",
        improvements: [...new Set([
            ...imageItems.flatMap((item) => item.improvements),
            ...readingFeedback.improvements,
            ...readingFeedback.readingItems.flatMap((item) => item.improvements)
        ])],
        encouragement: readingResponses.length
            ? readingFeedback.encouragement
            : imageItems.some((item) => item.accuracy < 100)
                ? "כל ניסיון מלמד אותנו משהו. נתרגל ונצליח יותר בפעם הבאה!"
                : "כל הכבוד על ההצלחה במבדק! המשך/י כך!",
        items,
        aiGenerated: readingFeedback.aiGenerated,
        generatedAt: new Date()
    };

    await Session.findByIdAndUpdate(sessionId, {
        report: report,
        score: score,
        status: "completed"
    });

    return report;
}

module.exports = { gradeSession };