import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { authMiddleware, roleGuard, AuthenticatedRequest } from '../middlewares/auth';
import { Role } from '@prisma/client';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);
router.use(roleGuard([Role.ADMIN]));

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  role: z.nativeEnum(Role),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  fullName: z.string().min(2).optional(),
  role: z.nativeEnum(Role).optional(),
});

// GET /
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    return res.json(users);
  } catch (error) {
    next(error);
  }
});

// POST /
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validatsiya xatosi', errors: parsed.error.format() });
    }

    const { email, password, fullName, role } = parsed.data;
    
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(400).json({ message: 'Ushbu email bilan foydalanuvchi allaqachon mavjud' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'CREATE_USER',
        entity: 'User',
        entityId: newUser.id,
        details: `Yangi foydalanuvchi yaratildi: ${email} (${role})`,
      },
    });

    return res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
});

// PUT /:id
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validatsiya xatosi', errors: parsed.error.format() });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'UPDATE_USER',
        entity: 'User',
        entityId: id,
        details: `Foydalanuvchi ma'lumotlari tahrirlandi: ${id}`,
      },
    });

    return res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

// DELETE /:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (req.user?.id === id) {
      return res.status(400).json({ message: 'O\'z hisobingizni o\'chira olmaysiz' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }

    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'DELETE_USER',
        entity: 'User',
        entityId: id,
        details: `Foydalanuvchi o'chirildi: ${user.email}`,
      },
    });

    return res.json({ message: 'Foydalanuvchi muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    next(error);
  }
});

// PATCH /:id/toggle-status
router.patch('/:id/toggle-status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (req.user?.id === id) {
      return res.status(400).json({ message: 'O\'z hisobingiz holatini o\'zgartira olmaysiz' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'TOGGLE_USER_STATUS',
        entity: 'User',
        entityId: id,
        details: `Foydalanuvchi holati o'zgartirildi: ${updated.isActive ? 'faol' : 'bloklangan'}`,
      },
    });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;
