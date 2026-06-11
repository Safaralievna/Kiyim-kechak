import app from './app';
import { logger } from './config/logger';

const requiredEnvVars = ['DATABASE_URL'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

const hasJwtSecret = process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET;
const hasRefreshSecret = process.env.JWT_REFRESH_SECRET || process.env.REFRESH_TOKEN_SECRET;

if (missingVars.length > 0 || !hasJwtSecret || !hasRefreshSecret) {
  const errors = [...missingVars];
  if (!hasJwtSecret) errors.push('JWT_SECRET (yoki ACCESS_TOKEN_SECRET)');
  if (!hasRefreshSecret) errors.push('JWT_REFRESH_SECRET (yoki REFRESH_TOKEN_SECRET)');
  
  console.error(`XATO: Quyidagi muhit o'zgaruvchilari topilmadi: ${errors.join(', ')}`);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server ${PORT}-portda muvaffaqiyatli ishga tushdi. Muhit: ${process.env.NODE_ENV || 'development'}`);
});
