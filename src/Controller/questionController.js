import Question from '../models/Question.js';

export const createQuestion = async (req, res) => {
    try {
        const question = new Question({
            ...req.body,
            createdBy: req.user.id
        });

        await question.save();
        res.status(201).json(question);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getMyQuestions = async (req, res) => {
    try {
        const questions = await Question.find({ createdBy: req.user.id })
            .sort({ createdAt: -1 });

        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }


        if (req.user.role === 'student') {
            const questionWithoutAnswers = {
                _id: question._id,
                questionText: question.questionText,
                questionType: question.questionType,
                marks: question.marks
            };

            if (question.questionType !== 'fill_in_blank') {
                questionWithoutAnswers.options = question.options.map(opt => ({ text: opt.text }));
            }

            return res.json(questionWithoutAnswers);
        }

        res.json(question);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateQuestion = async (req, res) => {
    try {
        const question = await Question.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        res.json(question);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user.id
        });

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
