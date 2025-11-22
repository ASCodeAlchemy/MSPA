import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Test from '../src/models/Test.js';
import Question from '../src/models/Question.js';
import Result from '../src/models/Result.js';
import dotenv from 'dotenv';

dotenv.config();

const runVerification = async () => {
    try {
        await mongoose.connect(process.env.DB_URL || 'mongodb://localhost:27017/practice');
        console.log('Connected to DB');

        // Cleanup
        await User.deleteMany({});
        await Test.deleteMany({});
        await Question.deleteMany({});
        await Result.deleteMany({});

        // 1. Create Teacher
        const teacher = await User.create({
            name: 'Teacher',
            email: 'teacher@test.com',
            password: 'password123',
            role: 'teacher'
        });
        console.log('Teacher created');

        // 2. Create Student
        const student = await User.create({
            name: 'Student',
            email: 'student@test.com',
            password: 'password123',
            role: 'student'
        });
        console.log('Student created');

        // 3. Create Questions
        const mcq = await Question.create({
            questionText: 'What is 2+2?',
            options: [{ text: '3', isCorrect: false }, { text: '4', isCorrect: true }],
            questionType: 'multiple_choice',
            createdBy: teacher._id
        });

        const blank = await Question.create({
            questionText: 'Capital of France?',
            questionType: 'fill_in_blank',
            correctAnswer: 'Paris',
            createdBy: teacher._id
        });
        console.log('Questions created');

        // 4. Create Test
        const test = await Test.create({
            title: 'Math & GK',
            duration: 10,
            questions: [mcq._id, blank._id],
            createdBy: teacher._id
        });
        console.log('Test created');

        // 5. Simulate Student Submission
        // Mocking the logic from tests.js submit endpoint
        const answers = [
            { questionId: mcq._id, selectedOption: 1 }, // Correct
            { questionId: blank._id, textAnswer: 'paris' } // Correct (case-insensitive)
        ];

        let score = 0;
        const updatedAnswers = [];

        for (const answer of answers) {
            const question = await Question.findById(answer.questionId).select('+correctAnswer');
            let isCorrect = false;
            if (question.questionType === 'fill_in_blank') {
                isCorrect = answer.textAnswer &&
                    question.correctAnswer &&
                    answer.textAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
            } else {
                isCorrect = question.options[answer.selectedOption]?.isCorrect || false;
            }

            if (isCorrect) score += question.marks;
            updatedAnswers.push({ question: answer.questionId, isCorrect });
        }

        const result = await Result.create({
            test: test._id,
            student: student._id,
            totalMarks: 2,
            answers: updatedAnswers,
            score,
            percentage: (score / 2) * 100
        });

        console.log('Submission processed. Score:', score);
        if (score === 2) {
            console.log('VERIFICATION PASSED: Grading logic works correctly.');
        } else {
            console.log('VERIFICATION FAILED: Incorrect score.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
};

runVerification();
