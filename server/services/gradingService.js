
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
    if (!Array.isArray(items) || !items.length) return 0;

    const weightOf = item =>
        boardWeights[item.boardName] ||
        boardWeights[item.part] || 1;

    const weightedPoints = items.reduce(
        (total, item) =>
            total + (Number(item.accuracy) || 0) * weightOf(item),
        0
    );

    const totalWeight = items.reduce(
        (total, item) => total + weightOf(item),
        0
    );

    return totalWeight
        ? Math.round(weightedPoints / totalWeight)
        : 0;
}

const AI_REQUEST_TIMEOUT_MS = 55000;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// חילוץ JSON גם כאשר המודל מחזיר Markdown או טקסט מסביב
function extractJSON(content) {
    if (typeof content !== "string" || !content.trim()) {
        throw new Error("AI returned empty content");
    }

    let cleaned = content
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

    // ניסיון ראשון: JSON נקי
    try {
        return JSON.parse(cleaned);
    } catch {}

    // ניסיון שני: חילוץ אובייקט JSON מתוך טקסט
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
        throw new Error("AI returned no JSON object");
    }

    return JSON.parse(cleaned.slice(start, end + 1));
}

// שליחת בקשה ל-OpenRouter
async function requestAiGrading(
    userContent,
    systemInstruction,
    expectedCount,
    timeoutMs
) {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        const error = new Error("OPENROUTER_API_KEY is missing");
        error.statusCode = 503;
        throw error;
    }

    const model =
        process.env.OPENROUTER_MODEL || "openrouter/free";

    let response;

    try {
        response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                signal: AbortSignal.timeout(timeoutMs),

                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer":
                        process.env.OPENROUTER_SITE_URL ||
                        "http://localhost:7000",
                    "X-Title": "Reading Assessment System"
                },

                body: JSON.stringify({
                    model,

                    messages: [
                        {
                            role: "system",
                            content: systemInstruction
                        },
                        {
                            role: "user",
                            content: userContent
                        }
                    ],

                    max_tokens:
                        Number(process.env.OPENROUTER_MAX_TOKENS) ||
                        4096,

                    temperature: 0.2
                })
            }
        );

    } catch (err) {
        const error = new Error(
            err.name === "TimeoutError" ||
            err.name === "AbortError"
                ? "OpenRouter request timed out"
                : String(err.message || "OpenRouter connection failed")
        );

        error.statusCode = 502;
        error.retryable = true;
        throw error;
    }

    let responseBody;

    try {
        responseBody = await response.json();
    } catch {
        const error = new Error(
            "OpenRouter returned an invalid HTTP response"
        );

        error.statusCode = 502;
        error.retryable = true;
        throw error;
    }

    if (!response.ok || responseBody.error) {
        const providerError = responseBody.error || {};

        const error = new Error(
            providerError.message ||
            `OpenRouter HTTP error ${response.status}`
        );

        error.upstreamStatus = response.status;
        error.retryable =
            response.status === 408 ||
            response.status === 429 ||
            response.status >= 500;

        error.statusCode =
            response.status === 429 ? 429 :
            error.retryable ? 502 : 500;

        throw error;
    }

    const choice = responseBody.choices?.[0];
    const message = choice?.message;

    if (!choice || !message) {
        console.error("OpenRouter response missing choice:", {
            model: responseBody.model,
            id: responseBody.id,
            usage: responseBody.usage
        });

        const error = new Error(
            "OpenRouter returned no assistant message"
        );

        error.statusCode = 502;
        error.retryable = true;
        throw error;
    }

    let content = message.content;

    // תמיכה גם בתוכן שמוחזר כמערך
    if (Array.isArray(content)) {
        content = content
            .filter(part => part.type === "text")
            .map(part => part.text || "")
            .join("");
    }

    if (typeof content !== "string" || !content.trim()) {
        console.error("OpenRouter returned empty content:", {
            model: responseBody.model,
            finishReason: choice.finish_reason,
            usage: responseBody.usage,
            hasReasoning: !!message.reasoning
        });

        const error = new Error(
            `OpenRouter returned empty content. Finish reason: ${choice.finish_reason}`
        );

        error.statusCode = 502;
        error.retryable = true;
        throw error;
    }

    let parsed;

    try {
        parsed = extractJSON(content);
    } catch (parseError) {
        console.error("Invalid JSON from OpenRouter:", {
            model: responseBody.model,
            finishReason: choice.finish_reason,
            contentPreview: content.slice(0, 1000)
        });

        const error = new Error(
            `AI returned invalid JSON: ${parseError.message}`
        );

        error.statusCode = 502;

        // תשובה שנקטעה עשויה להיפתר בניסיון נוסף
        error.retryable =
            choice.finish_reason === "length" ||
            choice.finish_reason === "error";

        throw error;
    }

    if (
        !parsed ||
        !Array.isArray(parsed.items) ||
        parsed.items.length !== expectedCount
    ) {
        console.error("Invalid grading structure:", {
            expectedCount,
            receivedCount: parsed?.items?.length,
            model: responseBody.model
        });

        const error = new Error(
            "AI grading response did not match submitted items"
        );

        error.statusCode = 502;
        error.retryable = true;
        throw error;
    }

    return parsed;
}

async function getAiReadingFeedback(responses, imageItems) {
    if (!process.env.OPENROUTER_API_KEY) {
        const error = new Error(
            "OPENROUTER_API_KEY is not configured"
        );

        error.statusCode = 503;
        throw error;
    }

    const payload = responses.map(response => ({
        part: response.part,
        board: response.boardName,
        target: response.itemText,
        studentResponse: response.responseText
    }));

    const systemInstruction =
        "את/ה מומחה/ית להערכת קריאה בעברית עבור תלמידים. " +
        "השווה בין פריט היעד לבין התשובה שנרשמה. " +
        "התייחס בנפרד לדיוק אותיות, כולל בלבולים בעלי דמיון חזותי או צלילי, " +
        "ניקוד, השמטות, הוספות וסדר. " +
        "הבחן בין חומרת בלבולים שונים. " +
        "החלפה שמשנה צליל או משמעות צריכה לקבל משקל שונה משגיאת ניקוד " +
        "או בלבול בין אותיות דומות. " +
        "אין להמציא שגיאות כאשר התשובה מתאימה. " +
        "קבע לכל פריט accuracy בין 0 ל-100. " +
        "שגיאת ניקוד בלבד צריכה להיות קלה יותר משינוי אות שמשנה את המילה. " +
        "התחשב גם בסיכום הצלחה וקושי בשאלות התמונות בעת כתיבת העידוד הכללי, " +
        "אך אל תשנה את ציוני התמונות. " +
        "החזר אך ורק אובייקט JSON תקין, ללא Markdown וללא טקסט מסביב. " +
        "מבנה התשובה חייב להיות: " +
        "{\"items\":[{\"accuracy\":number,\"strengths\":[string]," +
        "\"improvements\":[string],\"encouragement\":string}]," +
        "\"explanation\":string,\"improvements\":[string]," +
        "\"encouragement\":string}. " +
        "חובה להחזיר פריט אחד לכל תשובת תלמיד, באותו סדר. " +
        "כתוב בעברית מכבדת ומעודדת, בלי אבחנות רפואיות.";

    const userContent = JSON.stringify({
        readingItems: payload,

        imageSummary: imageItems.map(({ item, accuracy }) => ({
            item,
            accuracy
        }))
    });

    const maxAttempts = 2;
    const retryDelaysMs = [1500];

    let parsed;
    let lastError;

    const deadline = Date.now() + AI_REQUEST_TIMEOUT_MS;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const remainingMs = deadline - Date.now();

            if (remainingMs <= 0) {
                const error = new Error(
                    "AI grading exceeded the 55-second time limit"
                );

                error.statusCode = 504;
                throw error;
            }

            parsed = await requestAiGrading(
                userContent,
                systemInstruction,
                responses.length,
                remainingMs
            );

            break;

        } catch (error) {
            lastError = error;

            console.warn(
                `AI grading attempt ${attempt}/${maxAttempts} failed:`,
                {
                    message: error.message,
                    upstreamStatus: error.upstreamStatus
                }
            );

            if (
                !error.retryable ||
                attempt === maxAttempts ||
                deadline - Date.now() <=
                    retryDelaysMs[attempt - 1] + 1000
            ) {
                throw error;
            }

            await sleep(retryDelaysMs[attempt - 1]);
        }
    }

    if (!parsed) throw lastError;

    const readingItems = responses.map((item, index) => {
        const aiItem = parsed.items[index];

        return {
            part: item.part,
            boardName: item.boardName,
            item: item.itemText,
            response: item.responseText,

            accuracy: Math.max(
                0,
                Math.min(
                    100,
                    Number(aiItem.accuracy) || 0
                )
            ),

            strengths: Array.isArray(aiItem.strengths)
                ? aiItem.strengths
                : [],

            improvements: Array.isArray(aiItem.improvements)
                ? aiItem.improvements
                : [],

            encouragement: String(
                aiItem.encouragement || "כל הכבוד על המאמץ!"
            )
        };
    });

    const score = calculateWeightedScore(readingItems);

    return {
        score,

        explanation: String(
            parsed.explanation ||
            "הציון משקף את מידת הדיוק בתשובות שנבדקו."
        ),

        improvements: Array.isArray(parsed.improvements)
            ? parsed.improvements
            : [],

        encouragement: String(
            parsed.encouragement ||
            "המשך/י להתאמן, כל קריאה מקדמת אותך!"
        ),

        readingItems,
        aiGenerated: true
    };
}

async function runGradeSession(sessionId, examinerId) {
    let session = await Session.findById(sessionId);

    if (!session && examinerId) {
        session = await Session.findOne({
            _id: sessionId,
            examinerId
        });
    }

    if (!session) return null;

    const [imageAnswers, savedReadingResponses] =
        await Promise.all([
            ItemResult.find({ sessionId })
                .sort({ createdAt: 1 })
                .lean(),

            ReadingResponse.find({ sessionId })
                .sort({ createdAt: 1 })
                .lean()
        ]);

    const latestResponses = new Map();

    for (const response of savedReadingResponses) {
        latestResponses.set(
            `${response.part}:${response.boardName}:${response.itemIndex}`,
            response
        );
    }

    const readingResponses = [...latestResponses.values()];

    const imageItems = imageAnswers.map(answer => {
        const expected =
            answerKey[
                `${answer.questionGroup}:${answer.questionId}`
            ];

        const correct =
            expected !== undefined &&
            answer.selectedOptionId === expected;

        return {
            part: "wordToImage",

            item:
                `קבוצה ${answer.questionGroup}, שאלה ${answer.questionId}`,

            response:
                answer.selectedValue ||
                `אפשרות ${answer.selectedOptionId}`,

            accuracy: correct ? 100 : 0,

            strengths: correct
                ? ["בחירה נכונה"]
                : [],

            improvements:
                expected === undefined
                    ? ["לא הוגדר מפתח תשובה לשאלה זו"]
                    : correct
                        ? []
                        : ["כדאי לחזור על הבנת ההוראה או המשפט"],

            encouragement: correct
                ? "בחירה מצוינת!"
                : "טעות היא הזדמנות ללמוד, נמשיך לנסות!"
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
        readingFeedback = await getAiReadingFeedback(
            readingResponses,
            imageItems
        );
    }

    const items = [
        ...imageItems.map(item => ({
            ...item,
            boardName: "wordToImage"
        })),

        ...readingFeedback.readingItems
    ];

    const score = calculateWeightedScore(items);

    const report = {
        score: score ?? 0,

        explanation:
            readingResponses.length || imageAnswers.length
                ? readingResponses.length
                    ? readingFeedback.explanation
                    : "הציון מבוסס על תשובות התלמיד/ה בתרגילי התמונות."
                : "המבחן הסתיים בהצלחה. (לא נמצאו תשובות מפורטות בסשן זה).",

        improvements: [...new Set([
            ...imageItems.flatMap(item => item.improvements),
            ...readingFeedback.improvements,
            ...readingFeedback.readingItems.flatMap(
                item => item.improvements
            )
        ])],

        encouragement: readingResponses.length
            ? readingFeedback.encouragement
            : "כל הכבוד על השלמת המבחן!",

        items,
        aiGenerated: readingFeedback.aiGenerated,
        generatedAt: new Date()
    };

    await Session.findByIdAndUpdate(sessionId, {
        report,
        score: score ?? 0,
        status: "completed"
    });

    return report;
}

// מניעת בקשות כפולות לאותו מבחן
const gradingInProgress = new Map();

function gradeSession(sessionId, examinerId) {
    const key = String(sessionId);

    if (gradingInProgress.has(key)) {
        return gradingInProgress.get(key);
    }

    const promise = runGradeSession(sessionId, examinerId)
        .finally(() => gradingInProgress.delete(key));

    gradingInProgress.set(key, promise);

    return promise;
}

module.exports = { gradeSession };
