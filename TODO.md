- [ ] Update DB connection approach for AWS EC2 Docker deploy (use provided Render Postgres connection string)
- [x] Patch docker-compose.yml backend DATABASE_URL only for local dev if needed
- [x] Add/adjust backend environment handling (EC2 uchun .env.example yaratildi)


- [x] Run backend build + prisma generate check
- [x] Run prisma migrate/seed validation steps (as appropriate)
- [x] Fix any runtime issues found (SSL, pooling, Prisma errors, auth/db errors)


