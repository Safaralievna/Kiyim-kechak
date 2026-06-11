import { Router, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/auth';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const customerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(5),
  address: z.string().min(2),
});

// GET /
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { fullName: 'asc' },
    });
    return res.json(customers);
  } catch (error) {
    next(error);
  }
});

// GET /top
router.get('/top', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const top = await prisma.customer.findMany({
      take: 10,
      orderBy: { totalSpent: 'desc' },
    });
    return res.json(top);
  } catch (error) {
    next(error);
  }
});

// GET /:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ message: 'Mijoz topilmadi' });
    }
    return res.json(customer);
  } catch (error) {
    next(error);
  }
});

// GET /:id/orders
router.get('/:id/orders', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const orders = await prisma.order.findMany({
      where: { customerId: id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(orders);
  } catch (error) {
    next(error);
  }
});

// POST /
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = customerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validatsiya xatosi', errors: parsed.error.format() });
    }

    const exists = await prisma.customer.findUnique({ where: { email: parsed.data.email } });
    if (exists) {
      return res.status(400).json({ message: 'Ushbu email bilan mijoz allaqachon mavjud' });
    }

    const customer = await prisma.customer.create({
      data: parsed.data,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'CREATE_CUSTOMER',
        entity: 'Customer',
        entityId: customer.id,
        details: `Yangi mijoz yaratildi: ${customer.fullName}`,
      },
    });

    return res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
});

// PUT /:id
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const parsed = customerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validatsiya xatosi', errors: parsed.error.format() });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ message: 'Mijoz topilmadi' });
    }

    if (parsed.data.email !== customer.email) {
      const exists = await prisma.customer.findUnique({ where: { email: parsed.data.email } });
      if (exists) {
        return res.status(400).json({ message: 'Ushbu email bilan boshqa mijoz allaqachon mavjud' });
      }
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: parsed.data,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'UPDATE_CUSTOMER',
        entity: 'Customer',
        entityId: id,
        details: `Mijoz tahrirlandi: ${updated.fullName}`,
      },
    });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ message: 'Mijoz topilmadi' });
    }

    await prisma.customer.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'DELETE_CUSTOMER',
        entity: 'Customer',
        entityId: id,
        details: `Mijoz o'chirildi: ${customer.fullName}`,
      },
    });

    return res.json({ message: 'Mijoz muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    next(error);
  }
});

export default router;
