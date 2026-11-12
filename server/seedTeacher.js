require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const Teacher = require('./models/readingModel').Teacher

async function seedFirstTeacher() {
    const {
        SEED_TEACHER_NAME,
        SEED_TEACHER_USERNAME,
        SEED_TEACHER_PASSWORD
    } = process.env

    if (!SEED_TEACHER_NAME || !SEED_TEACHER_USERNAME || !SEED_TEACHER_PASSWORD) {
        throw new Error(
            'Set SEED_TEACHER_NAME, SEED_TEACHER_USERNAME, and SEED_TEACHER_PASSWORD.'
        )
    }

    if (!process.env.DATABASE_URI) {
        throw new Error('DATABASE_URI is not configured.')
    }

    await mongoose.connect(process.env.DATABASE_URI)

    const hashedPassword = await bcrypt.hash(SEED_TEACHER_PASSWORD, 10)

    await Teacher.findOneAndUpdate(
        { username: SEED_TEACHER_USERNAME },
        {
            Teachername: SEED_TEACHER_NAME,
            username: SEED_TEACHER_USERNAME,
            password: hashedPassword,
            role: 'admin'
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    )

    console.log('Admin account is ready.')
}

seedFirstTeacher()
    .catch((error) => {
        console.error('Could not create or update the admin account:', error.message)
        process.exitCode = 1
    })
    .finally(async () => {
        await mongoose.disconnect()
    })