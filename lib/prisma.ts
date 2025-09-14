import { PrismaClient } from '../app/generated/prisma';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: []
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
