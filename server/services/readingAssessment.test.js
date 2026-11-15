const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateReadingMetrics, wordToImageAnswerKey } = require("./readingAssessment");

test("calculates overall and per-part accuracy from assessed responses", () => {
    const metrics = calculateReadingMetrics([
        { part: "letters", itemText: "ב", evaluation: "accurate", errorType: "none", vowelErrorCount: 0 },
        { part: "combos", itemText: "דָ", evaluation: "error", errorType: "vowel", vowelErrorCount: 1 },
        { part: "nonwords", itemText: "רֶבֶּה", evaluation: "accurate", errorType: "none", vowelErrorCount: 0 }
    ]);

    assert.equal(metrics.overallScore, 67);
    assert.equal(metrics.totalAssessed, 3);
    assert.equal(metrics.parts.letters.accuracyPercent, 100);
    assert.equal(metrics.parts.combos.accuracyPercent, 0);
    assert.equal(metrics.parts.nonwords.accuracyPercent, 100);
    assert.equal(metrics.coverageNote, "הציון כולל את שאלות המשפטים והתמונות ואת פריטי הקריאה שנשמרו להם תשובה והערכת מורה.");
});

test("includes sentence and image questions in the overall score", () => {
    const metrics = calculateReadingMetrics(
        [
            { part: "letters", itemText: "ב", evaluation: "accurate", errorType: "none", vowelErrorCount: 0 },
            { part: "combos", itemText: "דָ", evaluation: "error", errorType: "vowel", vowelErrorCount: 1 }
        ],
        [
            { result: "correct" },
            { result: "incorrect" },
            { result: "correct" }
        ]
    );

    assert.equal(metrics.parts.wordToImage.assessed, 3);
    assert.equal(metrics.parts.wordToImage.correct, 2);
    assert.equal(metrics.parts.wordToImage.accuracyPercent, 67);
    assert.equal(metrics.totalAssessed, 5);
    assert.equal(metrics.overallScore, 60);
});

test("uses the correct answer key for the initial image questions", () => {
    assert.deepEqual(wordToImageAnswerKey, {
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
    });
});

test("flags vowel error rates at or above ten percent", () => {
    const atThreshold = calculateReadingMetrics([
        { part: "nonwords", itemText: "אָ".repeat(10), evaluation: "error", errorType: "vowel", vowelErrorCount: 1 }
    ]);
    const belowThreshold = calculateReadingMetrics([
        { part: "nonwords", itemText: "אָ".repeat(10), evaluation: "accurate", errorType: "none", vowelErrorCount: 0 }
    ]);

    assert.equal(atThreshold.vowelErrorPercent, 10);
    assert.equal(atThreshold.vowelStatus, "נדרש תרגול");
    assert.equal(belowThreshold.vowelErrorPercent, 0);
    assert.equal(belowThreshold.vowelStatus, "בשליטה");
});

test("marks missing assessments as unavailable instead of inventing scores", () => {
    const metrics = calculateReadingMetrics([]);

    assert.equal(metrics.overallScore, null);
    assert.equal(metrics.parts.letters.accuracyPercent, null);
    assert.equal(metrics.vowelErrorPercent, null);
    assert.equal(metrics.vowelStatus, "לא ניתן להעריך");
});

test("reports the observed error categories", () => {
    const metrics = calculateReadingMetrics([
        { part: "letters", itemText: "א", evaluation: "error", errorType: "visual", vowelErrorCount: 0 },
        { part: "combos", itemText: "דָ", evaluation: "error", errorType: "vowel", vowelErrorCount: 1 },
        { part: "nonwords", itemText: "רֶבֶּה", evaluation: "accurate", errorType: "none", vowelErrorCount: 0 }
    ]);

    assert.deepEqual(metrics.errorCounts, {
        "בלבול חזותי": 1,
        "בלבול תנועות": 1
    });
});
