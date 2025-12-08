import Result from '../models/Result.js';

export const getTestResults = async (req, res) => {
    try {
        const results = await Result.find({ test: req.params.testId })
            .populate('student', 'name email')
            .populate('test', 'title')
            .sort({ submittedAt: -1 });

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getMyResults = async (req, res) => {
    try {
        const results = await Result.find({ student: req.user.id })
            .populate('test', 'title description duration')
            .select('-score -percentage -totalMarks -answers')
            .sort({ submittedAt: -1 });

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getResultById = async (req, res) => {
    try {
        const result = await Result.findById(req.params.id)
            .populate('test')
            .populate('student', 'name email')
            .populate('answers.question');

        if (!result) {
            return res.status(404).json({ message: 'Result not found' });
        }


        if (req.user.role === 'student') {
            return res.status(403).json({ message: 'Access denied. Only teachers can view detailed results.' });
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
