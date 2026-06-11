import { Router, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authMiddleware, roleGuard, AuthenticatedRequest } from '../middlewares/auth';
import { Role, OrderStatus } from '@prisma/client';

const router = Router();
router.use(authMiddleware);
router.use(roleGuard([Role.ADMIN]));

// GET /revenue
router.get('/revenue', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {
      status: { not: OrderStatus.CANCELLED },
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    return res.json({
      totalRevenue,
      orderCount: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
});

// GET /inventory
router.get('/inventory', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany();

    const totalProductsCount = products.length;
    const totalItemsStock = products.reduce((sum, p) => sum + p.quantity, 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

    const categoriesMap: Record<string, { count: number, stock: number, value: number }> = {};
    for (const p of products) {
      if (!categoriesMap[p.category]) {
        categoriesMap[p.category] = { count: 0, stock: 0, value: 0 };
      }
      categoriesMap[p.category].count += 1;
      categoriesMap[p.category].stock += p.quantity;
      categoriesMap[p.category].value += p.price * p.quantity;
    }

    const categories = Object.keys(categoriesMap).map(cat => ({
      category: cat,
      ...categoriesMap[cat],
    }));

    return res.json({
      totalProductsCount,
      totalItemsStock,
      totalInventoryValue,
      categories,
    });
  } catch (error) {
    next(error);
  }
});

// GET /top-products
router.get('/top-products', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: { status: { not: OrderStatus.CANCELLED } }
      },
      include: {
        product: true,
      },
    });

    const salesMap: Record<string, { name: string, sku: string, quantitySold: number, revenueGenerated: number }> = {};
    for (const item of orderItems) {
      const pId = item.productId;
      if (!salesMap[pId]) {
        salesMap[pId] = {
          name: item.product.name,
          sku: item.product.sku,
          quantitySold: 0,
          revenueGenerated: 0,
        };
      }
      salesMap[pId].quantitySold += item.quantity;
      salesMap[pId].revenueGenerated += item.quantity * item.unitPrice;
    }

    const topProducts = Object.values(salesMap)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);

    return res.json(topProducts);
  } catch (error) {
    next(error);
  }
});

export default router;
