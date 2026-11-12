const mongoose = require('mongoose')
//const Schema = mongoose.Schema
const TeacherSchema = new mongoose.Schema({
    Teachername: {
        type: String,
        required: true,
        trim: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'teacher'],
        default: 'teacher',
        required: true
    },

});

const StudentSchema = new mongoose.Schema({
    Studentname: {
        type: String,
        required: true,
        trim: true
    },
    organization: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    // age: {
    //     type: Number,
    //     min: 0
    // },
});

const sessionSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    examinerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    status: {
        type: String,
        enum: ['in_progress', 'completed'],
        default: 'in_progress'
    },
    startedAt: {
        type: Date,
        default: Date.now,
    },
    completedAt: {
        type: Date
    }
});

const boardSchema = new mongoose.Schema({
    stage: {
        type: String,
        enum: ['A', 'B', 'C'],
        required: true
    },
    number: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    layout: {
        rows: Number,
        cols: Number
    }
})

const contentItemSchema = new mongoose.Schema({
    boardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
        required: true
    },
    kind: {
        type: String,
        enum: ['letter', 'combo', 'word', 'nonword', 'sentence', 'cloze'],
        required: true
    },
    text: {
        type: String,
        required: true
    },
    vowel: {
        type: String
    },
    syllableType: {
        type: String,
    },
    level: {
        type: String,
        enum: ['simple', 'intermediate', 'complex']
    },
    images: [{ type: String }],
    correctImageId: { type: String },
    distractors: { type: String }
})


const itemResultSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
        required: true
    },
    questionGroup: {
        type: String,
        required: true
    },
    questionId: {
        type: Number,
        required: true
    },
    selectedOptionId: {
        type: Number,
        required: true
    },
    selectedValue: {
        type: String,
        default: ""
    },
    result: {
        type: String,
        enum: ["correct", "incorrect", "self_corrected"],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const aiReportSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },
    part: {
        type: String,
        required: true
    },
    metricsJson: {
        type: Object,
        required: true
    },
    aiOutputJson: {
        type: Object,
        required: true
    },
    editedByExaminer: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const Teacher = mongoose.model('Teacher', TeacherSchema);
const Student = mongoose.model('Student', StudentSchema);
const Session = mongoose.model('Session', sessionSchema);
const Board = mongoose.model('Board', boardSchema);
const ContentItem = mongoose.model('ContentItem', contentItemSchema);
const ItemResult = mongoose.model('ItemResult', itemResultSchema);
const AiReport = mongoose.model('AiReport', aiReportSchema);

module.exports = {
    Teacher,
    Student,
    Session,
    Board,
    ContentItem,
    ItemResult,
    AiReport
}