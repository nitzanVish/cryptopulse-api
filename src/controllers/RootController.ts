/**
 * Root Controller - Handles root endpoint
 */

import { Request, Response } from 'express';
import { MESSAGES } from '../constants/messages.js';
import type { RootInfoResponse } from '../types/api.js';

export class RootController {
  static getInfo(_req: Request, res: Response<RootInfoResponse>): void {
    const response: RootInfoResponse = {
      message: MESSAGES.API.NAME,
      version: MESSAGES.API.VERSION,
    };
    res.json(response);
  }
}
