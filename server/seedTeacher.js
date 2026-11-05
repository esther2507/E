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

    await mongoose.connect('mongodb://localhost:27017/myapp')

    const hashedPassword = await bcrypt.hash(SEED_TEACHER_PASSWORD, 10)

    await Teacher.findOneAndUpdate(
        { username: SEED_TEACHER_USERNAME },
        { 
            Teachername: SEED_TEACHER_NAME,
            username: SEED_TEACHER_USERNAME,
            password: hashedPassword 
        },
        { upsert: true, returnDocument: 'after' }
    )

    console.log('First teacher created or updated successfully.')
}

seedFirstTeacher()
    .catch((error) => {
        console.error('Could not create or update the first teacher:', error.message)
        process.exitCode = 1
    })
    .finally(async () => {
        await mongoose.disconnect()
    })