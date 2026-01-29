const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing database queries...');
    
    const totalUsers = await prisma.user.count();
    console.log('Total users:', totalUsers);
    
    const totalSalons = await prisma.salon.count();
    console.log('Total salons:', totalSalons);
    
    const totalAppointments = await prisma.appointment.count();
    console.log('Total appointments:', totalAppointments);
    
    const pendingSalons = await prisma.salon.count({ where: { isVerified: false } });
    console.log('Pending salons:', pendingSalons);
    
    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    console.log('Recent users count:', recentUsers.length);
    
    const recentAppointments = await prisma.appointment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        salon: { select: { name: true } },
        service: { select: { name: true } }
      }
    });
    console.log('Recent appointments count:', recentAppointments.length);
    
    const completedAppointments = await prisma.appointment.findMany({
      where: { status: 'COMPLETED' }
    });
    console.log('Completed appointments:', completedAppointments.length);
    
    const totalRevenue = completedAppointments.reduce((sum, apt) => sum + (apt.price || 0), 0);
    console.log('Total revenue:', totalRevenue);
    
    console.log('\nAll queries passed!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
