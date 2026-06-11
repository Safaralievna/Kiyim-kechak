import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/auth';
import { z } from 'zod';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Noto\'g\'ri email format'),
  password: z.string().min(6, 'Parol kamida 6 belgidan iborat bo\'lishi kerak'),
});

const generateAccessToken = (user: { id: string; email: string; role: string; fullName: string }) => {
  const secret = process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET;
  if (!secret) throw new Error('JWT secret (JWT_SECRET yoki ACCESS_TOKEN_SECRET) sozlanmagan');
  return jwt.sign(user, secret, { expiresIn: '15m' });
};

const generateRefreshToken = (user: { id: string; email: string; role: string; fullName: string }) => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.REFRESH_TOKEN_SECRET;
  if (!secret) throw new Error('JWT refresh secret (JWT_REFRESH_SECRET yoki REFRESH_TOKEN_SECRET) sozlanmagan');
  return jwt.sign(user, secret, { expiresIn: '7d' });
};

// POST /login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validatsiya xatosi', errors: parsed.error.format() });
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Email yoki parol noto\'g\'ri, yoki hisob bloklangan' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email yoki parol noto\'g\'ri' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Set HTTP-only Cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // Must be false for HTTP deployment
      sameSite: 'lax', // Required for cross-origin cookies on HTTP
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        details: 'Foydalanuvchi tizimga kirdi',
      },
    });

    return res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /logout
router.post('/logout', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'LOGOUT',
          entity: 'User',
          entityId: req.user.id,
          details: 'Foydalanuvchi tizimdan chiqdi',
        },
      });
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false, // Must match original cookie settings
      sameSite: 'lax',
      path: '/',
    });
    return res.json({ message: 'Tizimdan muvaffaqiyatli chiqildi' });
  } catch (error) {
    next(error);
  }
});

// GET /me
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Avtorizatsiyadan o\'tilmagan' });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Foydalanuvchi topilmadi yoki bloklangan' });
    }
    return res.json(user);
  } catch (error) {
    next(error);
  }
});

// POST /refresh-token
router.post('/refresh-token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token topilmadi' });
    }

    const secret = process.env.JWT_REFRESH_SECRET || process.env.REFRESH_TOKEN_SECRET;
    if (!secret) {
      console.error('REFRESH_TOKEN_SECRET topilmadi');
      return res.status(500).json({ message: 'Server xatosi: Secret sozlanmagan' });
    }

    try {
      const decoded = jwt.verify(refreshToken, secret) as {
        id: string;
        email: string;
        role: any;
        fullName: string;
      };

      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Foydalanuvchi faol emas' });
      }

      const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      };

      const newAccessToken = generateAccessToken(payload);
      
      // Optionally rotate refresh token here if needed
      // const newRefreshToken = generateRefreshToken(payload);
      // res.cookie('refreshToken', newRefreshToken, { ... });

      return res.json({ 
        accessToken: newAccessToken,
        user: payload // Return user too to avoid extra call
      });
    } catch (err) {
      console.error('JWT verify hatosi:', err);
      return res.status(401).json({ message: 'Refresh token yaroqsiz yoki muddati o\'tgan' });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
