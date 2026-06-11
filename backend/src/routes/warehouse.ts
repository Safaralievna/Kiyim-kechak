import { Router, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authMiddleware, roleGuard, AuthenticatedRequest } from '../middlewares/auth';
import { Role, MovementType } from '@prisma/client';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);
router.use(roleGuard([Role.ADMIN, Role.MANAGER]));

const stockMovementSchema = z.object({
  productId: z.string(),
  warehouseId: z.string(),
  type: z.nativeEnum(MovementType),
  quantity: z.number().int().positive(),
  reason: z.string().min(2),
});

// GET /
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { name: 'asc' },
    });
    return res.json(warehouses);
  } catch (error) {
    next(error);
  }
});

// GET /movements
router.get('/movements', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: {
        product: true,
        warehouse: true,
      },
      orderBy: { date: 'desc' },
    });
    return res.json(movements);
  } catch (error) {
    next(error);
  }
});

// GET /:id/stock
router.get('/:id/stock', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
    });
    if (!warehouse) {
      return res.status(404).json({ message: 'Ombor topilmadi' });
    }

    const products = await prisma.product.findMany({
      include: { supplier: true },
    });

    return res.json({
      warehouse,
      products,
    });
  } catch (error) {
    next(error);
  }
});

// POST /stock-movement
router.post('/stock-movement', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = stockMovementSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validatsiya xatosi', errors: parsed.error.format() });
    }

    const { productId, warehouseId, type, quantity, reason } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error('Mahsulot topilmadi');

      const warehouse = await tx.warehouse.findUnique({ where: { id: warehouseId } });
      if (!warehouse) throw new Error('Ombor topilmadi');

      if (type === MovementType.OUT && product.quantity < quantity) {
        throw new Error(`Mahsulot miqdori yetarli emas. Omborda: ${product.quantity}, So'ralgan: ${quantity}`);
      }

      await tx.product.update({
        where: { id: productId },
        data: {
          quantity: type === MovementType.IN 
            ? { increment: quantity } 
            : { decrement: quantity }
        }
      });

      await tx.warehouse.update({
        where: { id: warehouseId },
        data: {
          currentStock: type === MovementType.IN
            ? { increment: quantity }
            : { decrement: quantity }
        }
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId,
          warehouseId,
          type,
          quantity,
          reason,
        },
        include: {
          product: true,
          warehouse: true,
        }
      });

      return movement;
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'STOCK_MOVEMENT',
        entity: 'Warehouse',
        entityId: warehouseId,
        details: `Stok harakati: ${type} ${quantity}x ${result.product.name} (Ombor: ${result.warehouse.name})`,
      },
    });

    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Stok harakatini qayd etishda xatolik' });
  }
});

export default router;
