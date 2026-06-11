import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { requestLogger } from './middlewares/logger';
import { errorHandler } from './middlewares/error';
import { rateLimiter } from './middlewares/rateLimiter';

import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import productsRoutes from './routes/products';
import customersRoutes from './routes/customers';
import ordersRoutes from './routes/orders';
import warehouseRoutes from './routes/warehouse';
import suppliersRoutes from './routes/suppliers';
import reportsRoutes from './routes/reports';
import dashboardRoutes from './routes/dashboard';
import healthRoutes from './routes/health';

dotenv.config();

const app = express();

app.use(helmet());

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(requestLogger);

app.use('/api/', rateLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/health', healthRoutes);

app.use(errorHandler);

export default app;
