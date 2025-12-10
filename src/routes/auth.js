import express from 'express';
import { register, login, logout, getMe } from '../Controller/authController.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', auth, getMe);

export default router;