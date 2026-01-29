const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@glamconnect.com' },
    select: { id: true, name: true, email: true, role: true }
  });
  
  console.log('Admin user:', admin);
  
  // List all users with their roles
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true }
  });
  console.log('\nAll users:');
  users.forEach(u => console.log(`  ${u.email} - ${u.role}`));
  
  await prisma.$disconnect();
}

main().catch(console.error);
