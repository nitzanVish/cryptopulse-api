/**
 * Sentiment API Routes
 */

import { Router } from 'express';
import sentimentController from '../controllers/SentimentController.js';
import { validate } from '../middlewares/validate.middleware.js';
import { getSentimentSchema } from '../dtos/sentiment.dto.js';

const router = Router();

router.get('/', sentimentController.getAllSentiments);
router.get('/:symbol', validate(getSentimentSchema), sentimentController.getSentiment);

export default router;
