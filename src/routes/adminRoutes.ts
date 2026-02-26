/**
 * Admin API routes (protected by token)
 */

import { Router } from 'express';
import { AdminSentimentController } from '../controllers/AdminSentimentController.js';
import { authenticateAdminApiKey } from '../middlewares/adminAuth.middleware.js';

const router = Router();

router.get('/sentiment/status', authenticateAdminApiKey, AdminSentimentController.getStatus);

export default router;
