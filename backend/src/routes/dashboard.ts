import { Router, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/auth';
import { OrderStatus } from '@prisma/client';

const router = Router();
router.use(authMiddleware);

// GET /stats
router.get('/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const role = req.user?.role;

    if (role === 'ADMIN' || role === 'MANAGER') {
      const [orderCount, activeProductCount, customerCount, revenueData, lowStockCount, recentOrders] = await Promise.all([
        prisma.order.count({ where: { status: { not: OrderStatus.CANCELLED } } }),
        prisma.product.count(),
        prisma.customer.count(),
        prisma.order.aggregate({
          where: { status: { not: OrderStatus.CANCELLED } },
          _sum: { totalAmount: true },
        }),
        prisma.product.count({ where: { quantity: { lt: 10 } } }),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { customer: true },
        }),
      ]);

      const totalRevenue = revenueData._sum.totalAmount || 0;

      const orderStatuses = await prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
      });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const orders30Days = await prisma.order.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: { not: OrderStatus.CANCELLED },
        },
        select: {
          totalAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      return res.json({
        role,
        stats: {
          ordersCount: orderCount,
          productsCount: activeProductCount,
          customersCount: customerCount,
          totalRevenue,
          lowStockCount,
        },
        orderStatuses,
        recentOrders,
        orders30Days,
      });
    } else {
      const customer = await prisma.customer.findUnique({
        where: { email: req.user?.email },
      });

      if (!customer) {
        return res.json({
          role,
          stats: {
            ordersCount: 0,
            productsCount: 0,
            customersCount: 0,
            totalRevenue: 0,
            lowStockCount: 0,
          },
          orderStatuses: [],
          recentOrders: [],
          orders30Days: [],
        });
      }

      const [orderCount, revenueData, recentOrders] = await Promise.all([
        prisma.order.count({ where: { customerId: customer.id, status: { not: OrderStatus.CANCELLED } } }),
        prisma.order.aggregate({
          where: { customerId: customer.id, status: { not: OrderStatus.CANCELLED } },
          _sum: { totalAmount: true },
        }),
        prisma.order.findMany({
          where: { customerId: customer.id },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { customer: true },
        }),
      ]);

      const totalSpent = revenueData._sum.totalAmount || 0;

      const orderStatuses = await prisma.order.groupBy({
        by: ['status'],
        where: { customerId: customer.id },
        _count: { id: true },
      });

      return res.json({
        role,
        stats: {
          ordersCount: orderCount,
          productsCount: 0,
          customersCount: 0,
          totalRevenue: totalSpent,
          lowStockCount: 0,
        },
        orderStatuses,
        recentOrders,
        orders30Days: [],
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
