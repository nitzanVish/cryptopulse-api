/**
 * Root Controller - Handles root endpoint
 */

import { Request, Response } from 'express';
import { MESSAGES } from '../constants/messages';

export class RootController {
  static getInfo(_req: Request, res: Response): void {
    res.json({
      message: MESSAGES.API.NAME,
      version: MESSAGES.API.VERSION,
    });
  }
}
