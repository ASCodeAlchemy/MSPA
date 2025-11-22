const validateTest = (req, res, next) => {
    const { title, duration } = req.body;

    if (!title || !duration) {
        return res.status(400).json({
            message: 'Title and duration are required'
        });
    }

    next();
};

const validateQuestion = (req, res, next) => {
    const { questionText, options, questionType, correctAnswer } = req.body;

    if (!questionText) {
        return res.status(400).json({
            message: 'Question text is required'
        });
    }

    if (questionType === 'fill_in_blank') {
        if (!correctAnswer) {
            return res.status(400).json({
                message: 'Correct answer is required for fill-in-the-blank questions'
            });
        }
    } else {
    
        if (!options || options.length < 2) {
            console.log('Validation failed: At least 2 options required', options);
            return res.status(400).json({
                message: 'At least 2 options are required'
            });
        }

        const hasCorrectAnswer = options.some(option => option.isCorrect);
        if (!hasCorrectAnswer) {
            console.log('Validation failed: No correct answer selected', options);
            return res.status(400).json({
                message: 'At least one option must be marked as correct'
            });
        }
    }

    next();
};

export { validateTest, validateQuestion };