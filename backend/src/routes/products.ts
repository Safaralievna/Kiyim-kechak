import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import { prisma } from '../config/db';
import { authMiddleware, roleGuard, AuthenticatedRequest } from '../middlewares/auth';
import { Role } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(3),
  category: z.string().min(2),
  price: z.number().positive(),
  quantity: z.number().nonnegative().default(0),
  warehouseLocation: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
});

// GET / - Public to authenticated users
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      include: { supplier: true },
      orderBy: { name: 'asc' },
    });
    return res.json(products);
  } catch (error) {
    next(error);
  }
});

// GET /low-stock
router.get('/low-stock', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      where: { quantity: { lt: 10 } },
      include: { supplier: true },
      orderBy: { quantity: 'asc' },
    });
    return res.json(products);
  } catch (error) {
    next(error);
  }
});

// GET /by-category
router.get('/by-category', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const groups = await prisma.product.groupBy({
      by: ['category'],
      _count: { id: true },
      _sum: { quantity: true },
    });
    return res.json(groups);
  } catch (error) {
    next(error);
  }
});

// GET /:id
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { supplier: true },
    });
    if (!product) {
      return res.status(404).json({ message: 'Mahsulot topilmadi' });
    }
    return res.json(product);
  } catch (error) {
    next(error);
  }
});

// POST / - ADMIN/MANAGER only
router.post('/', authMiddleware, roleGuard([Role.ADMIN, Role.MANAGER]), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validatsiya xatosi', errors: parsed.error.format() });
    }

    const exists = await prisma.product.findUnique({ where: { sku: parsed.data.sku } });
    if (exists) {
      return res.status(400).json({ message: 'Ushbu SKU bilan mahsulot allaqachon mavjud' });
    }

    const product = await prisma.product.create({
      data: parsed.data,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'CREATE_PRODUCT',
        entity: 'Product',
        entityId: product.id,
        details: `Yangi mahsulot yaratildi: ${product.name} (SKU: ${product.sku})`,
      },
    });

    return res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

// PUT /:id - ADMIN/MANAGER only
router.put('/:id', authMiddleware, roleGuard([Role.ADMIN, Role.MANAGER]), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validatsiya xatosi', errors: parsed.error.format() });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ message: 'Mahsulot topilmadi' });
    }

    if (parsed.data.sku !== product.sku) {
      const exists = await prisma.product.findUnique({ where: { sku: parsed.data.sku } });
      if (exists) {
        return res.status(400).json({ message: 'Ushbu SKU bilan boshqa mahsulot allaqachon mavjud' });
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: parsed.data,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'UPDATE_PRODUCT',
        entity: 'Product',
        entityId: id,
        details: `Mahsulot tahrirlandi: ${updated.name} (SKU: ${updated.sku})`,
      },
    });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /:id - ADMIN/MANAGER only
router.delete('/:id', authMiddleware, roleGuard([Role.ADMIN, Role.MANAGER]), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ message: 'Mahsulot topilmadi' });
    }

    await prisma.product.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'DELETE_PRODUCT',
        entity: 'Product',
        entityId: id,
        details: `Mahsulot o'chirildi: ${product.name} (SKU: ${product.sku})`,
      },
    });

    return res.json({ message: 'Mahsulot muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    next(error);
  }
});

// POST /bulk-import - CSV upload (ADMIN/MANAGER only)
router.post('/bulk-import', authMiddleware, roleGuard([Role.ADMIN, Role.MANAGER]), upload.single('file'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Fayl yuklanmagan' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const lines = csvContent.split(/\r?\n/);
    if (lines.length <= 1) {
      return res.status(400).json({ message: 'CSV fayli bo\'sh' });
    }

    const importedProducts = [];
    const errorsList = [];

    const defaultSupplier = await prisma.supplier.findFirst();
    const defaultSupplierId = defaultSupplier?.id || null;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [name, sku, category, priceStr, qtyStr, warehouseLocation, supplierId] = line.split(',');

      if (!name || !sku || !category || !priceStr) {
        errorsList.push(`Qator ${i+1}: majburiy maydonlar to'liq emas`);
        continue;
      }

      const price = parseFloat(priceStr.trim());
      const quantity = parseInt((qtyStr || '0').trim(), 10);

      if (isNaN(price) || isNaN(quantity)) {
        errorsList.push(`Qator ${i+1}: Narx yoki Miqdor son bo'lishi shart`);
        continue;
      }

      try {
        const finalSupplierId = supplierId?.trim() || defaultSupplierId;

        const product = await prisma.product.upsert({
          where: { sku: sku.trim() },
          update: {
            name: name.trim(),
            category: category.trim(),
            price,
            quantity: { increment: quantity },
            warehouseLocation: warehouseLocation?.trim() || null,
            supplierId: finalSupplierId,
          },
          create: {
            name: name.trim(),
            sku: sku.trim(),
            category: category.trim(),
            price,
            quantity,
            warehouseLocation: warehouseLocation?.trim() || null,
            supplierId: finalSupplierId,
          },
        });
        importedProducts.push(product);
      } catch (err: any) {
        errorsList.push(`Qator ${i+1}: Xatolik yuz berdi (${err.message})`);
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'BULK_IMPORT_PRODUCTS',
        entity: 'Product',
        details: `Ommaviy import: ${importedProducts.length} ta mahsulot yuklandi. Xatolar: ${errorsList.length}`,
      },
    });

    return res.json({
      message: 'Ommaviy import yakunlandi',
      importedCount: importedProducts.length,
      errors: errorsList,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
