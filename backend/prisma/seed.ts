import { PrismaClient, Role, OrderStatus, MovementType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean database
  await prisma.auditLog.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.warehouse.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Users
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const managerPassword = await bcrypt.hash('Manager123!', 10);
  const userPassword = await bcrypt.hash('User123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@company.uz',
      password: adminPassword,
      fullName: 'Administrator',
      role: Role.ADMIN,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@company.uz',
      password: managerPassword,
      fullName: 'Manager',
      role: Role.MANAGER,
    },
  });

  const normalUser = await prisma.user.create({
    data: {
      email: 'user@company.uz',
      password: userPassword,
      fullName: 'Standard User',
      role: Role.USER,
    },
  });

  console.log('Users created successfully.');

  // 3. Create Suppliers
  const suppliersData = [
    { name: 'Toshkent Tekstil MChJ', contactEmail: 'toshkent@textile.uz', phone: '+998712345678', address: 'Toshkent', country: 'Uzbekistan' },
    { name: 'Istanbul Fashion Ltd', contactEmail: 'info@istfashion.tr', phone: '+905321234567', address: 'Istanbul', country: 'Turkey' },
    { name: 'China Garment Co', contactEmail: 'sales@chinagarment.cn', phone: '+8613812345678', address: 'Guangzhou', country: 'China' },
    { name: 'Delhi Fabric House', contactEmail: 'contact@delhifabric.in', phone: '+911234567890', address: 'Delhi', country: 'India' },
    { name: 'Dubai Trade FZCO', contactEmail: 'info@dubaitrade.ae', phone: '+97145678901', address: 'Dubai', country: 'UAE' },
  ];

  const suppliers = [];
  for (const s of suppliersData) {
    const supplier = await prisma.supplier.create({ data: s });
    suppliers.push(supplier);
  }
  console.log('Suppliers created.');

  // 4. Create Warehouses
  const warehousesData = [
    { name: 'Asosiy ombor', location: 'Toshkent', capacity: 10000, currentStock: 0 },
    { name: 'Samarqand filiali', location: 'Samarqand', capacity: 5000, currentStock: 0 },
    { name: 'Andijon filiali', location: 'Andijon', capacity: 3000, currentStock: 0 },
  ];

  const warehouses = [];
  for (const w of warehousesData) {
    const warehouse = await prisma.warehouse.create({ data: w });
    warehouses.push(warehouse);
  }
  console.log('Warehouses created.');

  // 5. Create Customers
  const customersData = [
    { fullName: 'Hamidov Jasur', email: 'jasur@gmail.com', phone: '+998901234567', address: 'Toshkent' },
    { fullName: 'Karimova Nilufar', email: 'nilufar@mail.ru', phone: '+998911234567', address: 'Samarqand' },
    { fullName: 'Rahimov Bobur', email: 'bobur@gmail.com', phone: '+998931234567', address: 'Andijon' },
    { fullName: 'Aliyeva Madina', email: 'madina@gmail.com', phone: '+998941234567', address: 'Namangan' },
    { fullName: 'Ubaydullayev Sardor', email: 'sardor@mail.ru', phone: '+998951234567', address: 'Farg\'ona' },
    { fullName: 'Solihov Temur', email: 'temur@gmail.com', phone: '+998971234567', address: 'Buxoro' },
    { fullName: 'Usmanova Ziyoda', email: 'ziyoda@gmail.com', phone: '+998981234567', address: 'Xiva' },
    { fullName: 'Abdullayev Farruh', email: 'farruh@mail.ru', phone: '+998991234567', address: 'Qarshi' },
    { fullName: 'Ganiyeva Shahnoza', email: 'shahnoza@gmail.com', phone: '+998907654321', address: 'Nukus' },
    { fullName: 'Tojiyev Sherzod', email: 'sherzod@gmail.com', phone: '+998917654321', address: 'Jizzax' },
    { fullName: 'Rasulova Gulnoza', email: 'gulnoza@mail.ru', phone: '+998937654321', address: 'Guliston' },
    { fullName: 'Hoshimov Davron', email: 'davron@gmail.com', phone: '+998947654321', address: 'Navoiy' },
    { fullName: 'Akbarov Alisher', email: 'alisher@gmail.com', phone: '+998957654321', address: 'Toshkent' },
    { fullName: 'Saidova Dilnoza', email: 'dilnoza@mail.ru', phone: '+998977654321', address: 'Samarqand' },
    { fullName: 'Yuldashev Rustam', email: 'rustam@gmail.com', phone: '+998997654321', address: 'Andijon' },
  ];

  const customers = [];
  for (const c of customersData) {
    const customer = await prisma.customer.create({ data: c });
    customers.push(customer);
  }
  console.log('Customers created.');

  // 6. Create Products (at least 40 products)
  const productsData = [
    // Erkaklar kiyimi
    { name: 'Klassik ko\'ylak', sku: 'MEN-SHR-001', category: 'Erkaklar kiyimi', price: 12.50, quantity: 250, warehouseLocation: 'A-12' },
    { name: 'Slim fit shim', sku: 'MEN-PNT-002', category: 'Erkaklar kiyimi', price: 18.00, quantity: 180, warehouseLocation: 'A-13' },
    { name: 'Sport futbolka', sku: 'MEN-TSH-003', category: 'Erkaklar kiyimi', price: 7.00, quantity: 500, warehouseLocation: 'A-14' },
    { name: 'Kostyum', sku: 'MEN-SUT-004', category: 'Erkaklar kiyimi', price: 65.00, quantity: 80, warehouseLocation: 'B-01' },
    { name: 'Jinsi shim', sku: 'MEN-JNS-005', category: 'Erkaklar kiyimi', price: 22.00, quantity: 300, warehouseLocation: 'B-02' },
    { name: 'Yozgi polo', sku: 'MEN-POL-006', category: 'Erkaklar kiyimi', price: 9.50, quantity: 420, warehouseLocation: 'B-03' },
    { name: 'Qishki palto', sku: 'MEN-COT-007', category: 'Erkaklar kiyimi', price: 85.00, quantity: 60, warehouseLocation: 'B-04' },
    { name: 'Hoodie', sku: 'MEN-HOD-008', category: 'Erkaklar kiyimi', price: 25.00, quantity: 200, warehouseLocation: 'B-05' },

    // Ayollar kiyimi
    { name: 'Yozgi ko\'ylak', sku: 'WOM-DRS-001', category: 'Ayollar kiyimi', price: 15.00, quantity: 320, warehouseLocation: 'C-01' },
    { name: 'Bluzka', sku: 'WOM-BLZ-002', category: 'Ayollar kiyimi', price: 11.00, quantity: 280, warehouseLocation: 'C-02' },
    { name: 'Yubka', sku: 'WOM-SKT-003', category: 'Ayollar kiyimi', price: 13.50, quantity: 200, warehouseLocation: 'C-03' },
    { name: 'Jinsi shim', sku: 'WOM-JNS-004', category: 'Ayollar kiyimi', price: 20.00, quantity: 250, warehouseLocation: 'C-04' },
    { name: 'Kechki ko\'ylak', sku: 'WOM-EVN-005', category: 'Ayollar kiyimi', price: 45.00, quantity: 70, warehouseLocation: 'D-01' },
    { name: 'Sport to\'plam', sku: 'WOM-SPT-006', category: 'Ayollar kiyimi', price: 30.00, quantity: 150, warehouseLocation: 'D-02' },
    { name: 'Trench palto', sku: 'WOM-TRN-007', category: 'Ayollar kiyimi', price: 75.00, quantity: 55, warehouseLocation: 'D-03' },
    { name: 'Kardigan', sku: 'WOM-CRD-008', category: 'Ayollar kiyimi', price: 19.00, quantity: 180, warehouseLocation: 'D-04' },

    // Bolalar kiyimi
    { name: 'Maktab formasi', sku: 'KID-SCH-001', category: 'Bolalar kiyimi', price: 18.00, quantity: 400, warehouseLocation: 'E-01' },
    { name: 'Sport futbolka', sku: 'KID-TSH-002', category: 'Bolalar kiyimi', price: 6.00, quantity: 600, warehouseLocation: 'E-02' },
    { name: 'Jinsi shim', sku: 'KID-JNS-003', category: 'Bolalar kiyimi', price: 12.00, quantity: 350, warehouseLocation: 'E-03' },
    { name: 'Qishki kurtka', sku: 'KID-JKT-004', category: 'Bolalar kiyimi', price: 35.00, quantity: 120, warehouseLocation: 'E-04' },
    { name: 'Pijama', sku: 'KID-PJM-005', category: 'Bolalar kiyimi', price: 10.00, quantity: 280, warehouseLocation: 'E-05' },

    // Aksessuarlar
    { name: 'Kamar', sku: 'ACC-BLT-001', category: 'Aksessuarlar', price: 8.00, quantity: 500, warehouseLocation: 'F-01' },
    { name: 'Galstuk', sku: 'ACC-TIE-002', category: 'Aksessuarlar', price: 6.50, quantity: 300, warehouseLocation: 'F-02' },
    { name: 'Sharf', sku: 'ACC-SCF-003', category: 'Aksessuarlar', price: 9.00, quantity: 250, warehouseLocation: 'F-03' },
    { name: 'Qo\'lqop', sku: 'ACC-GLV-004', category: 'Aksessuarlar', price: 7.50, quantity: 200, warehouseLocation: 'F-04' },
    { name: 'Kepka', sku: 'ACC-CAP-005', category: 'Aksessuarlar', price: 5.00, quantity: 450, warehouseLocation: 'F-05' },

    // Ichki kiyim
    { name: 'Erkaklar to\'plami', sku: 'UND-MEN-001', category: 'Ichki kiyim', price: 14.00, quantity: 600, warehouseLocation: 'G-01' },
    { name: 'Ayollar to\'plami', sku: 'UND-WOM-001', category: 'Ichki kiyim', price: 16.00, quantity: 500, warehouseLocation: 'G-02' },
    { name: 'Bolalar to\'plami', sku: 'UND-KID-001', category: 'Ichki kiyim', price: 10.00, quantity: 400, warehouseLocation: 'G-03' },

    // Poyabzal
    { name: 'Erkaklar klassik tufli', sku: 'SHO-MEN-001', category: 'Poyabzal', price: 45.00, quantity: 150, warehouseLocation: 'H-01' },
    { name: 'Ayollar poshnali', sku: 'SHO-WOM-001', category: 'Poyabzal', price: 38.00, quantity: 130, warehouseLocation: 'H-02' },
    { name: 'Sport krossovka', sku: 'SHO-SPT-001', category: 'Poyabzal', price: 32.00, quantity: 200, warehouseLocation: 'H-03' },
    { name: 'Bolalar tufli', sku: 'SHO-KID-001', category: 'Poyabzal', price: 20.00, quantity: 180, warehouseLocation: 'H-04' },
  ];

  const products = [];
  for (let i = 0; i < productsData.length; i++) {
    const p = productsData[i];
    // Assign a random supplier
    const supplier = suppliers[i % suppliers.length];
    const product = await prisma.product.create({
      data: {
        ...p,
        supplierId: supplier.id,
      },
    });
    products.push(product);
  }
  console.log(`Products created: ${products.length}.`);

  // Update warehouses currentStock based on initial seed quantity distribution
  let wIndex = 0;
  for (const prod of products) {
    const warehouse = warehouses[wIndex % warehouses.length];
    await prisma.warehouse.update({
      where: { id: warehouse.id },
      data: {
        currentStock: {
          increment: prod.quantity,
        },
      },
    });
    wIndex++;
  }

  // 7. Create Orders (30 orders)
  // Statuses: 8 DELIVERED, 7 SHIPPED, 6 PROCESSING, 5 PENDING, 4 CANCELLED
  const statuses: OrderStatus[] = [
    ...Array(8).fill(OrderStatus.DELIVERED),
    ...Array(7).fill(OrderStatus.SHIPPED),
    ...Array(6).fill(OrderStatus.PROCESSING),
    ...Array(5).fill(OrderStatus.PENDING),
    ...Array(4).fill(OrderStatus.CANCELLED),
  ];

  const orders = [];
  for (let i = 0; i < 30; i++) {
    const status = statuses[i];
    const customer = customers[i % customers.length];
    
    // Choose 1-3 random products
    const itemsCount = Math.floor(Math.random() * 3) + 1;
    const orderItemsList = [];
    let totalAmount = 0;

    for (let j = 0; j < itemsCount; j++) {
      const prod = products[(i + j * 7) % products.length];
      const qty = Math.floor(Math.random() * 5) + 1; // 1-5 quantity
      totalAmount += prod.price * qty;
      orderItemsList.push({
        productId: prod.id,
        quantity: qty,
        unitPrice: prod.price,
      });
    }

    // Set a date in the last 60 days
    const daysAgo = Math.floor(Math.random() * 60);
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - daysAgo);

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        status,
        totalAmount,
        createdAt: orderDate,
        items: {
          create: orderItemsList,
        },
      },
      include: {
        items: true,
      },
    });

    // Create Invoice if not CANCELLED
    if (status !== OrderStatus.CANCELLED) {
      const isPaid = status === OrderStatus.DELIVERED || (status === OrderStatus.SHIPPED && Math.random() > 0.3);
      const dueDate = new Date(orderDate);
      dueDate.setDate(dueDate.getDate() + 14); // 2 weeks terms

      await prisma.invoice.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          isPaid,
          dueDate,
          createdAt: orderDate,
        },
      });
    }

    orders.push(order);
  }

  console.log('Orders and invoices created.');

  // Update Customers totalOrders and totalSpent statistics
  for (const cust of customers) {
    const custOrders = orders.filter(o => o.customerId === cust.id && o.status !== OrderStatus.CANCELLED);
    const totalSpent = custOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    await prisma.customer.update({
      where: { id: cust.id },
      data: {
        totalOrders: custOrders.length,
        totalSpent,
      },
    });
  }

  // 8. Stock Movements (20 movements: 12 IN, 8 OUT)
  for (let i = 0; i < 20; i++) {
    const isIncoming = i < 12; // 12 IN, 8 OUT
    const prod = products[(i * 3) % products.length];
    const warehouse = warehouses[i % warehouses.length];
    const qty = Math.floor(Math.random() * 20) + 10; // 10-30 units

    await prisma.stockMovement.create({
      data: {
        productId: prod.id,
        warehouseId: warehouse.id,
        type: isIncoming ? MovementType.IN : MovementType.OUT,
        quantity: qty,
        reason: isIncoming ? 'Kirim - Ta\'minotchidan keldi' : 'Chiqim - Buyurtma yuklandi',
        date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log('Stock movements created.');

  // 9. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'DATABASE_SEED',
      entity: 'System',
      details: 'Demo data seeding successfully executed',
    },
  });

  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
