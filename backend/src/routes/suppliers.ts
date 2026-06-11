import { Router, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authMiddleware, roleGuard, AuthenticatedRequest } from '../middlewares/auth';
import { Role } from '@prisma/client';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const supplierSchema = z.object({
  name: z.string().min(2),
  contactEmail: z.string().email(),
  phone: z.string().min(5),
  address: z.string().min(2),
  country: z.string().min(2),
});

// GET /
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    });
    return res.json(suppliers);
  } catch (error) {
    next(error);
  }
});

// GET /:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      return res.status(404).json({ message: 'Ta\'minotchi topilmadi' });
    }
    return res.json(supplier);
  } catch (error) {
    next(error);
  }
});

// POST /
router.post('/', roleGuard([Role.ADMIN, Role.MANAGER]), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = supplierSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validatsiya xatosi', errors: parsed.error.format() });
    }

    const supplier = await prisma.supplier.create({
      data: parsed.data,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'CREATE_SUPPLIER',
        entity: 'Supplier',
        entityId: supplier.id,
        details: `Yangi ta'minotchi qo'shildi: ${supplier.name}`,
      },
    });

    return res.status(201).json(supplier);
  } catch (error) {
    next(error);
  }
});

// PUT /:id
router.put('/:id', roleGuard([Role.ADMIN, Role.MANAGER]), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const parsed = supplierSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validatsiya xatosi', errors: parsed.error.format() });
    }

    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      return res.status(404).json({ message: 'Ta\'minotchi topilmadi' });
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: parsed.data,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'UPDATE_SUPPLIER',
        entity: 'Supplier',
        entityId: id,
        details: `Ta'minotchi tahrirlandi: ${updated.name}`,
      },
    });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /:id
router.delete('/:id', roleGuard([Role.ADMIN, Role.MANAGER]), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      return res.status(404).json({ message: 'Ta\'minotchi topilmadi' });
    }

    await prisma.supplier.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'DELETE_SUPPLIER',
        entity: 'Supplier',
        entityId: id,
        details: `Ta'minotchi o'chirildi: ${supplier.name}`,
      },
    });

    return res.json({ message: 'Ta\'minotchi muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    next(error);
  }
});

export default router;
