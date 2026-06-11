import { Router, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/auth';
import { OrderStatus } from '@prisma/client';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const createOrderSchema = z.object({
  customerId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
  })).min(1),
});

// GET /
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, customerId, startDate, endDate } = req.query;

    const where: any = {};
    if (status) where.status = status as OrderStatus;
    if (customerId) where.customerId = customerId as string;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    if (req.user?.role === 'USER') {
      const customer = await prisma.customer.findUnique({ where: { email: req.user.email } });
      if (customer) {
        where.customerId = customer.id;
      } else {
        return res.json([]);
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(orders);
  } catch (error) {
    next(error);
  }
});

// GET /stats
router.get('/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    
    const startOfToday = new Date(today);
    startOfToday.setHours(0,0,0,0);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0,0,0,0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [dailyOrders, weeklyOrders, monthlyOrders] = await Promise.all([
      prisma.order.findMany({ where: { createdAt: { gte: startOfToday }, status: { not: OrderStatus.CANCELLED } } }),
      prisma.order.findMany({ where: { createdAt: { gte: startOfWeek }, status: { not: OrderStatus.CANCELLED } } }),
      prisma.order.findMany({ where: { createdAt: { gte: startOfMonth }, status: { not: OrderStatus.CANCELLED } } }),
    ]);

    const dailyRevenue = dailyOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const weeklyRevenue = weeklyOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    return res.json({
      daily: { count: dailyOrders.length, revenue: dailyRevenue },
      weekly: { count: weeklyOrders.length, revenue: weeklyRevenue },
      monthly: { count: monthlyOrders.length, revenue: monthlyRevenue },
    });
  } catch (error) {
    next(error);
  }
});

// GET /:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: { product: true }
        },
        invoices: true
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Buyurtma topilmadi' });
    }

    return res.json(order);
  } catch (error) {
    next(error);
  }
});

// POST /
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validatsiya xatosi', errors: parsed.error.format() });
    }

    const { customerId, items } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        throw new Error('Mijoz topilmadi');
      }

      let totalAmount = 0;
      const orderItemsToCreate = [];

      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw new Error(`Mahsulot topilmadi: ID ${item.productId}`);
        }
        if (product.quantity < item.quantity) {
          throw new Error(`Omborda yetarli mahsulot yo'q: ${product.name} (SKU: ${product.sku}). Qolgan: ${product.quantity}`);
        }

        await tx.product.update({
          where: { id: product.id },
          data: { quantity: { decrement: item.quantity } }
        });

        totalAmount += product.price * item.quantity;
        orderItemsToCreate.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.price
        });
      }

      const newOrder = await tx.order.create({
        data: {
          customerId,
          status: OrderStatus.PENDING,
          totalAmount,
          items: {
            create: orderItemsToCreate
          }
        },
        include: {
          items: true
        }
      });

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      await tx.invoice.create({
        data: {
          orderId: newOrder.id,
          amount: totalAmount,
          dueDate,
        }
      });

      await tx.customer.update({
        where: { id: customerId },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: totalAmount }
        }
      });

      for (const item of items) {
        const warehouse = await tx.warehouse.findFirst();
        if (warehouse) {
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              warehouseId: warehouse.id,
              type: 'OUT',
              quantity: item.quantity,
              reason: `Buyurtma yaratildi: #${newOrder.id}`,
            }
          });

          await tx.warehouse.update({
            where: { id: warehouse.id },
            data: {
              currentStock: { decrement: item.quantity }
            }
          });
        }
      }

      return newOrder;
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'CREATE_ORDER',
        entity: 'Order',
        entityId: result.id,
        details: `Yangi buyurtma yaratildi: #${result.id}, Summa: $${result.totalAmount}`,
      },
    });

    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Buyurtma yaratishda xatolik yuz berdi' });
  }
});

// PATCH /:id/status
router.patch('/:id/status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(OrderStatus).includes(status)) {
      return res.status(400).json({ message: 'Noto\'g\'ri holat qiymati' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ message: 'Buyurtma topilmadi' });
    }

    const oldStatus = order.status;
    if (oldStatus === status) {
      return res.json(order);
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (status === OrderStatus.CANCELLED && oldStatus !== OrderStatus.CANCELLED) {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { increment: item.quantity } }
          });

          const warehouse = await tx.warehouse.findFirst();
          if (warehouse) {
            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                warehouseId: warehouse.id,
                type: 'IN',
                quantity: item.quantity,
                reason: `Buyurtma bekor qilindi: #${order.id}`,
              }
            });

            await tx.warehouse.update({
              where: { id: warehouse.id },
              data: { currentStock: { increment: item.quantity } }
            });
          }
        }

        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            totalOrders: { decrement: 1 },
            totalSpent: { decrement: order.totalAmount }
          }
        });
      }

      if (status === OrderStatus.DELIVERED) {
        await tx.invoice.updateMany({
          where: { orderId: order.id },
          data: { isPaid: true }
        });
      }

      return tx.order.update({
        where: { id },
        data: { status },
        include: { customer: true, items: { include: { product: true } } }
      });
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'UPDATE_ORDER_STATUS',
        entity: 'Order',
        entityId: id,
        details: `Buyurtma holati o'zgartirildi: ${oldStatus} -> ${status}`,
      },
    });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;
