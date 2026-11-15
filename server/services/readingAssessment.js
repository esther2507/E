const partLabels = {
    wordToImage: "משפטים ותמונות",
    letters: "אותיות",
    combos: "צירופים",
    nonwords: "מילות תפל"
};

const errorLabels = {
    vowel: "בלבול תנועות",
    auditory: "בלבול שמיעתי",
    visual: "בלבול חזותי",
    omission: "השמטה",
    addition: "הוספה",
    substitution: "החלפה",
    other: "אחר"
};

const wordToImageAnswerKey = {
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

const countVowels = (text) => (text.match(/[\u05B0-\u05BB]/g) || []).length;

const calculateReadingMetrics = (responses, itemResults = []) => {
    const parts = {};

    const imageCorrect = itemResults.filter((result) => result.result === "correct").length;
    parts.wordToImage = {
        label: partLabels.wordToImage,
        assessed: itemResults.length,
        correct: imageCorrect,
        accuracyPercent: itemResults.length
            ? Math.round((imageCorrect / itemResults.length) * 100)
            : null
    };

    for (const [part, label] of Object.entries(partLabels)) {
        if (part === "wordToImage") continue;
        const partResponses = responses.filter((response) => response.part === part);
        const correct = partResponses.filter((response) => response.evaluation === "accurate").length;
        parts[part] = {
            label,
            assessed: partResponses.length,
            correct,
            accuracyPercent: partResponses.length
                ? Math.round((correct / partResponses.length) * 100)
                : null
        };
    }

    const readingCorrect = responses.filter((response) => response.evaluation === "accurate").length;
    const correct = readingCorrect + imageCorrect;
    const totalAssessed = responses.length + itemResults.length;
    const vowelOccurrences = responses.reduce(
        (total, response) => total + countVowels(response.itemText),
        0
    );
    const vowelErrors = responses.reduce(
        (total, response) => total + (response.errorType === "vowel" ? response.vowelErrorCount : 0),
        0
    );
    const vowelErrorPercent = vowelOccurrences
        ? Number(((vowelErrors / vowelOccurrences) * 100).toFixed(2))
        : null;
    const errorCounts = {};

    for (const response of responses) {
        if (response.errorType !== "none") {
            errorCounts[errorLabels[response.errorType]] =
                (errorCounts[errorLabels[response.errorType]] || 0) + 1;
        }
    }

    return {
        overallScore: totalAssessed
            ? Math.round((correct / totalAssessed) * 100)
            : null,
        totalAssessed,
        coverageNote: "הציון כולל את שאלות המשפטים והתמונות ואת פריטי הקריאה שנשמרו להם תשובה והערכת מורה.",
        correct,
        accuracyPercent: totalAssessed
            ? Math.round((correct / totalAssessed) * 100)
            : null,
        parts,
        vowelOccurrences,
        vowelErrors,
        vowelErrorPercent,
        vowelStatus: vowelErrorPercent === null
            ? "לא ניתן להעריך"
            : vowelErrorPercent >= 10
                ? "נדרש תרגול"
                : "בשליטה",
        errorCounts,
        fluency: {
            assessed: false,
            note: "שטף לא נמדד; ספי הדירוג לא הוגדרו במלואם."
        }
    };
};

module.exports = { calculateReadingMetrics, wordToImageAnswerKey };
