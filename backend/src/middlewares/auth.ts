import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    fullName: string;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Avtorizatsiyadan o\'tilmagan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET;
    const decoded = jwt.verify(token, secret!) as {
      id: string;
      email: string;
      role: Role;
      fullName: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token yaroqsiz yoki muddati o\'tgan' });
  }
};

export const roleGuard = (roles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Avtorizatsiyadan o\'tilmagan' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Ushbu amalni bajarish uchun ruxsat yo\'q' });
    }
    next();
  };
};
