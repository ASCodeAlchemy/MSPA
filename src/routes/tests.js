import express from 'express';
import {
    createTest,
    getMyTests,
    getActiveTests, // Added
    getTestById,
    startTest,
    submitTest,
    updateTest,
    deleteTest,
    publishTest
} from '../Controller/testController.js';
import { auth, requireTeacher, requireStudent } from '../middlewares/auth.js';
import { validateTest } from '../middlewares/validation.js';
import Test from '../models/Test.js';
import Question from '../models/Question.js';
import Result from '../models/Result.js';

const router = express.Router();


router.post('/', auth, requireTeacher, validateTest, async (req, res) => {
    try {
        const test = new Test({
            ...req.body,
            createdBy: req.user.id
        });

        await test.save();
        await test.populate('questions');
        res.status(201).json(test);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


router.get('/my-tests', auth, requireTeacher, async (req, res) => {
    try {
        const tests = await Test.find({ createdBy: req.user.id })
            .populate('questions')
            .sort({ createdAt: -1 });

        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// Route to get active tests (Visible to students only)
router.get('/active', auth, requireStudent, getActiveTests);


router.get('/:id', auth, async (req, res) => {
    try {
        const test = await Test.findById(req.params.id).populate('questions');

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }


        if (req.user.role === 'student') {
            if (!test.isActive) {
                return res.status(403).json({ message: 'Test is not active' });
            }

            const testWithoutAnswers = {
                _id: test._id,
                title: test.title,
                description: test.description,
                duration: test.duration,
                questions: test.questions.map(q => ({
                    _id: q._id,
                    questionText: q.questionText,
                    options: q.options.map(opt => ({ text: opt.text })),
                    questionType: q.questionType,
                    marks: q.marks
                }))
            };
            return res.json(testWithoutAnswers);
        }

        res.json(test);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


router.post('/:id/start', auth, requireStudent, async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);

        if (!test || !test.isActive) {
            return res.status(404).json({ message: 'Test not found or inactive' });
        }


        const existingResult = await Result.findOne({
            test: test._id,
            student: req.user.id
        });

        if (existingResult) {
            if (existingResult.submittedAt) {
                return res.status(400).json({ message: 'Test already attempted' });
            }

            // Resume Test
            return res.json({
                testId: test._id,
                duration: test.duration,
                totalQuestions: test.questions.length,
                totalMarks: existingResult.totalMarks,
                startTime: existingResult.createdAt, // Use original start time
                isResumed: true
            });
        }


        const questions = await Question.find({ _id: { $in: test.questions } });
        const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);


        const result = new Result({
            test: test._id,
            student: req.user.id,
            totalMarks,
            answers: test.questions.map(questionId => ({
                question: questionId
            }))
        });

        await result.save();

        res.json({
            testId: test._id,
            duration: test.duration,
            totalQuestions: test.questions.length,
            totalMarks,
            startTime: result.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


router.post('/:id/submit', auth, requireStudent, async (req, res) => {
    try {
        const { answers, timeTaken, autoSubmitted = false } = req.body;
        const test = await Test.findById(req.params.id);

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }


        let result = await Result.findOne({
            test: test._id,
            student: req.user.id
        }).populate('answers.question');

        if (!result) {
            return res.status(400).json({ message: 'Test not started' });
        }

        if (result.submittedAt) {
            return res.status(400).json({ message: 'Test already submitted' });
        }


        let score = 0;
        const updatedAnswers = await Promise.all(
            answers.map(async (answer) => {
                const question = await Question.findById(answer.questionId).select('+correctAnswer');
                if (!question) return null;

                let isCorrect = false;
                if (question.questionType === 'fill_in_blank') {

                    isCorrect = answer.textAnswer &&
                        question.correctAnswer &&
                        answer.textAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
                } else {

                    isCorrect = question.options[answer.selectedOption]?.isCorrect || false;
                }

                if (isCorrect) {
                    score += question.marks;
                }

                return {
                    question: answer.questionId,
                    selectedOption: answer.selectedOption,
                    textAnswer: answer.textAnswer,
                    isCorrect
                };
            })
        );


        const validAnswers = updatedAnswers.filter(answer => answer !== null);


        result.answers = validAnswers;
        result.score = score;
        result.percentage = (score / result.totalMarks) * 100;
        result.timeTaken = timeTaken;
        result.autoSubmitted = autoSubmitted;
        result.submittedAt = new Date();

        await result.save();

        res.json({
            message: 'Test submitted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


router.put('/:id', auth, requireTeacher, async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        // Check ownership
        // Check ownership (if test has an owner)
        if (test.createdBy && test.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this test' });
        }

        const updatedTest = await Test.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('questions');

        res.json(updatedTest);
    } catch (error) {
        console.error('Error in PUT /tests/:id:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


router.delete('/:id', auth, requireTeacher, async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        // Check ownership
        // Check ownership (if test has an owner)
        if (test.createdBy && test.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this test' });
        }

        await Test.findByIdAndDelete(req.params.id);
        await Result.deleteMany({ test: req.params.id });

        res.json({ message: 'Test deleted successfully' });
    } catch (error) {
        console.error('Error in DELETE /tests/:id:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.put('/:id/publish', auth, requireTeacher, async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        // Check ownership
        if (test.createdBy && test.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to publish this test' });
        }

        test.isActive = true;
        await test.save();

        res.json({ message: 'Test published successfully', test });
    } catch (error) {
        console.error('Error in PUT /tests/:id/publish:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;