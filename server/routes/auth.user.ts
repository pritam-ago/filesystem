import express from 'express';
import { signup, login, getMe } from '../controllers/auth.user.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);

export default router; 