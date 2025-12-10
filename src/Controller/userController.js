import User from '../models/User.js';

export const enrollTeacher = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code || code.length !== 4) {
            return res.status(400).json({ message: 'Invalid 4-digit code' });
        }

        const teacher = await User.findOne({ teacherCode: code, role: 'teacher' });

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found with this code' });
        }

        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Only students can enroll' });
        }

        if (req.user.enrolledTeachers.includes(teacher._id)) {
            return res.status(400).json({ message: 'Already enrolled with this teacher' });
        }

        req.user.enrolledTeachers.push(teacher._id);
        await req.user.save();

        res.json({
            message: 'Successfully enrolled with teacher',
            teacher: {
                name: teacher.name,
                email: teacher.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
