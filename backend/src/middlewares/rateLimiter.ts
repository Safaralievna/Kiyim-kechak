import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Haddan tashqari ko\'p so\'rov yuborildi, iltimos 15 daqiqadan so\'ng qayta urinib ko\'ring.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
