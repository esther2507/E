const partLabels = {
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

const countVowels = (text) => (text.match(/[\u05B0-\u05BB]/g) || []).length;

const calculateReadingMetrics = (responses) => {
    const parts = {};

    for (const [part, label] of Object.entries(partLabels)) {
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

    const correct = responses.filter((response) => response.evaluation === "accurate").length;
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
        overallScore: responses.length
            ? Math.round((correct / responses.length) * 100)
            : null,
        totalAssessed: responses.length,
        coverageNote: "הציון מחושב רק מתוך הפריטים שנשמרו להם תשובת תלמיד/ה והערכת מורה.",
        correct,
        accuracyPercent: responses.length
            ? Math.round((correct / responses.length) * 100)
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

module.exports = { calculateReadingMetrics };
