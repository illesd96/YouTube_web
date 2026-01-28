import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Lazy initialization to prevent build-time database connection attempts
let prismaInstance: PrismaClient | undefined;

function getPrismaClient() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
  return prismaInstance;
}

export const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    const client = globalForPrisma.prisma ?? getPrismaClient();
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = client;
    }
    return client[prop as keyof PrismaClient];
  },
});
