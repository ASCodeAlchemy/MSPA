import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
};

export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;


        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }


        if (role === 'teacher') {
            let isUnique = false;
            let code;
            while (!isUnique) {
                code = Math.floor(1000 + Math.random() * 9000).toString();
                const existingUser = await User.findOne({ teacherCode: code });
                if (!existingUser) isUnique = true;
            }
            user = new User({ name, email, password, role, teacherCode: code });
        } else {
            user = new User({ name, email, password, role });
        }

        await user.save();


        const payload = { id: user.id };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', {
            expiresIn: '24h'
        });


        res.cookie('token', token, cookieOptions);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,

                role: user.role,
                teacherCode: user.teacherCode,
                enrolledTeachers: user.enrolledTeachers
            }
        });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;


        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }


        const isMatch = await user.correctPassword(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }


        const payload = { id: user.id };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', {
            expiresIn: '24h'
        });


        res.cookie('token', token, cookieOptions);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                teacherCode: user.teacherCode,
                enrolledTeachers: user.enrolledTeachers
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });

    res.json({ message: 'Logout successful' });
};

export const getMe = async (req, res) => {
    res.json({
        user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,

            role: req.user.role,
            teacherCode: req.user.teacherCode,
            enrolledTeachers: req.user.enrolledTeachers
        }
    });
};
