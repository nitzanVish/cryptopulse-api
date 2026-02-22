/**
 * Sentiment API Routes
 */

import { Router } from 'express';
import sentimentController from '../controllers/SentimentController';
import { validate } from '../middlewares/validate.middleware';
import { getSentimentSchema } from '../dtos/sentiment.dto';

const router = Router();

router.get('/', sentimentController.getAllSentiments);
router.get('/:symbol', validate(getSentimentSchema), sentimentController.getSentiment);

export default router;
