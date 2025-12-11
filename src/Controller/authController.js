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
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', {
            expiresIn: '15m'
        });
        const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret', {
            expiresIn: '90d'
        });

        user.refreshToken = refreshToken;
        await user.save();


        res.cookie('token', accessToken, cookieOptions);

        res.status(201).json({
            message: 'User registered successfully',
            accessToken,
            refreshToken,
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
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', {
            expiresIn: '15m'
        });
        const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret', {
            expiresIn: '90d'
        });

        user.refreshToken = refreshToken;
        await user.save();


        res.cookie('token', accessToken, cookieOptions);

        res.json({
            message: 'Login successful',
            accessToken,
            refreshToken,
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

export const logout = async (req, res) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies.token) {
            token = req.cookies.token;
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
                const user = await User.findById(decoded.id);
                if (user) {
                    user.refreshToken = undefined;
                    await user.save();
                }
            } catch (err) {
                // Ignore token verification errors during logout
            }
        }

        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.json({ message: 'Logout successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh Token is required' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret');
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ message: 'Invalid Refresh Token' });
        }

        const payload = { id: user.id };
        const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', {
            expiresIn: '15m'
        });

        res.cookie('token', newAccessToken, cookieOptions);

        res.json({
            accessToken: newAccessToken
        });
    } catch (error) {
        console.log(error);
        return res.status(403).json({ message: 'Invalid Refresh Token' });
    }
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
