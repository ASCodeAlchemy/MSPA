import express from 'express';
import { enrollTeacher } from '../Controller/userController.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

router.post('/enroll', auth, enrollTeacher);

export default router;
