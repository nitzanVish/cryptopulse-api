/**
 * Validation Middleware - Generic Zod validation for Express requests
 */

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { HTTP_STATUS } from '../constants/httpStatus';

/**
 * Generic validation middleware that validates body, query, and params
 * @param schema Zod schema that can include body, query, and params
 */
export const validate = (schema: AnyZodObject) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate all parts of the request (Body, Query, Params)
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Replace request data with validated data
      if (validated.body) req.body = validated.body;
      if (validated.query) req.query = validated.query;
      if (validated.params) req.params = validated.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format error messages to be readable
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        next(new AppError(`Validation Error: ${messages.join(', ')}`, HTTP_STATUS.BAD_REQUEST));
      } else {
        next(error);
      }
    }
  };
