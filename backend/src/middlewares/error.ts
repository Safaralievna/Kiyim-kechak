import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`${req.method} ${req.originalUrl} - Error: ${err.message || err}`, { stack: err.stack });

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Serverda ichki xatolik yuz berdi';

  res.status(status).json({
    status: 'error',
    statusCode: status,
    message,
    errors: err.errors || undefined,
  });
};
