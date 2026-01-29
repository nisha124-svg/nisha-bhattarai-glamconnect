import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Clear existing data
    await prisma.appointment.deleteMany();
    await prisma.review.deleteMany();
    await prisma.customerHistory.deleteMany();
    await prisma.promoCode.deleteMany();
    await prisma.staffSchedule.deleteMany();
    await prisma.stylist.deleteMany();
    await prisma.service.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.salon.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Cleared existing data');

    // =====================
    // CREATE USERS
    // =====================
    const hashedPassword = await bcrypt.hash('password123', 12);
    const adminPassword = await bcrypt.hash('admin123', 12);

    // Admin User
    const admin = await prisma.user.create({
        data: {
            email: 'admin@glamconnect.com',
            password: adminPassword,
            name: 'Sarah Admin',
            role: 'ADMIN'
        }
    });
    console.log(`✅ Created admin: ${admin.email}`);

    // Salon Owners
    const salonOwner1 = await prisma.user.create({
        data: {
            email: 'priya@luxesalon.com',
            password: hashedPassword,
            name: 'Priya Sharma',
            role: 'SALON_OWNER'
        }
    });

    const salonOwner2 = await prisma.user.create({
        data: {
            email: 'maya@blushstudio.com',
            password: hashedPassword,
            name: 'Maya Patel',
            role: 'SALON_OWNER'
        }
    });

    const salonOwner3 = await prisma.user.create({
        data: {
            email: 'anjali@zenbeauty.com',
            password: hashedPassword,
            name: 'Anjali Rai',
            role: 'SALON_OWNER'
        }
    });
    console.log(`✅ Created 3 salon owners`);

    // Regular Customers
    const customers = await Promise.all([
        prisma.user.create({
            data: {
                email: 'emma.wilson@gmail.com',
                password: hashedPassword,
                name: 'Emma Wilson',
                role: 'USER'
            }
        }),
        prisma.user.create({
            data: {
                email: 'sophia.johnson@gmail.com',
                password: hashedPassword,
                name: 'Sophia Johnson',
                role: 'USER'
            }
        }),
        prisma.user.create({
            data: {
                email: 'olivia.brown@gmail.com',
                password: hashedPassword,
                name: 'Olivia Brown',
                role: 'USER'
            }
        }),
        prisma.user.create({
            data: {
                email: 'ava.martinez@gmail.com',
                password: hashedPassword,
                name: 'Ava Martinez',
                role: 'USER'
            }
        }),
        prisma.user.create({
            data: {
                email: 'isabella.garcia@gmail.com',
                password: hashedPassword,
                name: 'Isabella Garcia',
                role: 'USER'
            }
        }),
        prisma.user.create({
            data: {
                email: 'mia.anderson@gmail.com',
                password: hashedPassword,
                name: 'Mia Anderson',
                role: 'USER'
            }
        }),
        prisma.user.create({
            data: {
                email: 'charlotte.taylor@gmail.com',
                password: hashedPassword,
                name: 'Charlotte Taylor',
                role: 'USER'
            }
        }),
        prisma.user.create({
            data: {
                email: 'amelia.thomas@gmail.com',
                password: hashedPassword,
                name: 'Amelia Thomas',
                role: 'USER'
            }
        }),
        prisma.user.create({
            data: {
                email: 'harper.moore@gmail.com',
                password: hashedPassword,
                name: 'Harper Moore',
                role: 'USER'
            }
        }),
        prisma.user.create({
            data: {
                email: 'evelyn.jackson@gmail.com',
                password: hashedPassword,
                name: 'Evelyn Jackson',
                role: 'USER'
            }
        })
    ]);
    console.log(`✅ Created ${customers.length} customers`);

    // =====================
    // CREATE SALONS
    // =====================
    const salon1 = await prisma.salon.create({
        data: {
            name: 'Luxe & Glow Beauty Bar',
            address: '123 Kathmandu Mall, Durbar Marg, Kathmandu',
            image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
            gallery: [
                'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
                'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=400',
                'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=400'
            ],
            description: 'Experience premium pampering at Luxe & Glow. We specialize in organic facials, modern hair styling, and relaxing spa treatments designed to rejuvenate your spirit. Our expert team uses only high-quality products to ensure you leave feeling refreshed and beautiful.',
            tags: ['Hair', 'Spa', 'Nails', 'Organic'],
            rating: 4.8,
            reviewCount: 156,
            isVerified: true,
            ownerId: salonOwner1.id,
            latitude: 27.7172,
            longitude: 85.3240,
            city: 'Kathmandu'
        }
    });

    const salon2 = await prisma.salon.create({
        data: {
            name: 'Blush Bridal Studio',
            address: '45 Lakeside Road, Pokhara',
            image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800',
            gallery: [
                'https://images.unsplash.com/photo-1457972729786-0411a3b2b626?w=400',
                'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400'
            ],
            description: 'Your dream wedding look starts here. Blush Bridal Studio specializes in creating stunning bridal makeup and hairstyles that will make your special day unforgettable. Our master artists have years of experience in bridal beauty.',
            tags: ['Bridal', 'Makeup', 'Hair'],
            rating: 4.9,
            reviewCount: 89,
            isVerified: true,
            ownerId: salonOwner2.id,
            latitude: 28.2096,
            longitude: 83.9856,
            city: 'Pokhara'
        }
    });

    const salon3 = await prisma.salon.create({
        data: {
            name: 'Zen Beauty & Wellness',
            address: '78 New Road, Thamel, Kathmandu',
            image: 'https://images.unsplash.com/photo-1470259078422-826894b933aa?w=800',
            gallery: [
                'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400',
                'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
                'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400'
            ],
            description: 'Find your inner peace at Zen Beauty & Wellness. We combine traditional Nepali beauty treatments with modern techniques. From relaxing massages to rejuvenating facials, we offer a complete wellness experience.',
            tags: ['Spa', 'Wellness', 'Massage', 'Facial'],
            rating: 4.7,
            reviewCount: 203,
            isVerified: true,
            ownerId: salonOwner3.id,
            latitude: 27.7152,
            longitude: 85.3123,
            city: 'Kathmandu'
        }
    });

    const salon4 = await prisma.salon.create({
        data: {
            name: 'Glamour House',
            address: '234 Civil Mall, Sundhara, Kathmandu',
            image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
            gallery: [
                'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
                'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400'
            ],
            description: 'Where style meets sophistication. Glamour House offers the latest trends in hair styling, coloring, and treatments. Our team of expert stylists will help you achieve the look you have always dreamed of.',
            tags: ['Hair', 'Color', 'Styling', 'Keratin'],
            rating: 4.6,
            reviewCount: 178,
            isVerified: true,
            ownerId: salonOwner1.id,
            latitude: 27.7019,
            longitude: 85.3153,
            city: 'Kathmandu'
        }
    });

    const salon5 = await prisma.salon.create({
        data: {
            name: 'Nail Art Paradise',
            address: '56 Boudha, Kathmandu',
            image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800',
            gallery: [
                'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400',
                'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400'
            ],
            description: 'Express yourself through nail art! Nail Art Paradise is Kathmandu\'s premier nail salon, offering everything from classic manicures to intricate nail art designs. We use premium products for long-lasting results.',
            tags: ['Nails', 'Nail Art', 'Manicure', 'Pedicure'],
            rating: 4.5,
            reviewCount: 134,
            isVerified: false,
            ownerId: salonOwner2.id,
            latitude: 27.7215,
            longitude: 85.3617,
            city: 'Kathmandu'
        }
    });
    console.log(`✅ Created 5 salons (4 verified, 1 pending)`);

    // =====================
    // CREATE SERVICES
    // =====================
    // Salon 1 Services
    const services1 = await Promise.all([
        prisma.service.create({ data: { name: 'Signature Blowout', duration: 45, price: 1500, category: 'Hair', salonId: salon1.id } }),
        prisma.service.create({ data: { name: 'Hair Coloring', duration: 120, price: 4500, category: 'Hair', salonId: salon1.id } }),
        prisma.service.create({ data: { name: 'Keratin Treatment', duration: 180, price: 8000, category: 'Hair', salonId: salon1.id } }),
        prisma.service.create({ data: { name: 'Gel Manicure', duration: 60, price: 800, category: 'Nails', salonId: salon1.id } }),
        prisma.service.create({ data: { name: 'Spa Pedicure', duration: 75, price: 1200, category: 'Nails', salonId: salon1.id } }),
        prisma.service.create({ data: { name: 'Hydrating Facial', duration: 90, price: 2500, category: 'Spa', salonId: salon1.id } }),
        prisma.service.create({ data: { name: 'Deep Tissue Massage', duration: 60, price: 2000, category: 'Spa', salonId: salon1.id } }),
    ]);

    // Salon 2 Services (Bridal)
    const services2 = await Promise.all([
        prisma.service.create({ data: { name: 'Bridal Makeup Trial', duration: 120, price: 5000, category: 'Bridal', salonId: salon2.id } }),
        prisma.service.create({ data: { name: 'Wedding Day Makeup', duration: 150, price: 15000, category: 'Bridal', salonId: salon2.id } }),
        prisma.service.create({ data: { name: 'Bridal Hair Styling', duration: 90, price: 8000, category: 'Bridal', salonId: salon2.id } }),
        prisma.service.create({ data: { name: 'Full Bridal Package', duration: 240, price: 25000, category: 'Bridal', salonId: salon2.id } }),
        prisma.service.create({ data: { name: 'Party Makeup', duration: 60, price: 3500, category: 'Makeup', salonId: salon2.id } }),
        prisma.service.create({ data: { name: 'Mehndi Application', duration: 120, price: 3000, category: 'Bridal', salonId: salon2.id } }),
    ]);

    // Salon 3 Services (Wellness)
    const services3 = await Promise.all([
        prisma.service.create({ data: { name: 'Swedish Massage', duration: 60, price: 2500, category: 'Spa', salonId: salon3.id } }),
        prisma.service.create({ data: { name: 'Hot Stone Therapy', duration: 90, price: 3500, category: 'Spa', salonId: salon3.id } }),
        prisma.service.create({ data: { name: 'Anti-Aging Facial', duration: 75, price: 3000, category: 'Spa', salonId: salon3.id } }),
        prisma.service.create({ data: { name: 'Body Scrub & Wrap', duration: 90, price: 4000, category: 'Spa', salonId: salon3.id } }),
        prisma.service.create({ data: { name: 'Aromatherapy Session', duration: 45, price: 1800, category: 'Wellness', salonId: salon3.id } }),
    ]);

    // Salon 4 Services (Hair)
    const services4 = await Promise.all([
        prisma.service.create({ data: { name: 'Haircut & Style', duration: 45, price: 800, category: 'Hair', salonId: salon4.id } }),
        prisma.service.create({ data: { name: 'Balayage', duration: 180, price: 6000, category: 'Hair', salonId: salon4.id } }),
        prisma.service.create({ data: { name: 'Highlights', duration: 120, price: 4000, category: 'Hair', salonId: salon4.id } }),
        prisma.service.create({ data: { name: 'Hair Spa Treatment', duration: 60, price: 1500, category: 'Hair', salonId: salon4.id } }),
        prisma.service.create({ data: { name: 'Straightening', duration: 150, price: 5000, category: 'Hair', salonId: salon4.id } }),
    ]);

    // Salon 5 Services (Nails)
    const services5 = await Promise.all([
        prisma.service.create({ data: { name: 'Classic Manicure', duration: 30, price: 500, category: 'Nails', salonId: salon5.id } }),
        prisma.service.create({ data: { name: 'Gel Extensions', duration: 90, price: 2000, category: 'Nails', salonId: salon5.id } }),
        prisma.service.create({ data: { name: 'Nail Art Design', duration: 60, price: 1500, category: 'Nails', salonId: salon5.id } }),
        prisma.service.create({ data: { name: 'Acrylic Full Set', duration: 120, price: 2500, category: 'Nails', salonId: salon5.id } }),
        prisma.service.create({ data: { name: 'Luxury Pedicure', duration: 60, price: 1000, category: 'Nails', salonId: salon5.id } }),
    ]);
    console.log(`✅ Created services for all salons`);

    // =====================
    // CREATE STYLISTS
    // =====================
    const stylists1 = await Promise.all([
        prisma.stylist.create({ data: { name: 'Sunita Thapa', role: 'Senior Stylist', avatar: 'https://randomuser.me/api/portraits/women/1.jpg', rating: 4.9, salonId: salon1.id } }),
        prisma.stylist.create({ data: { name: 'Rajan KC', role: 'Color Expert', avatar: 'https://randomuser.me/api/portraits/men/1.jpg', rating: 4.8, salonId: salon1.id } }),
        prisma.stylist.create({ data: { name: 'Anita Gurung', role: 'Spa Therapist', avatar: 'https://randomuser.me/api/portraits/women/2.jpg', rating: 4.7, salonId: salon1.id } }),
    ]);

    const stylists2 = await Promise.all([
        prisma.stylist.create({ data: { name: 'Priya Shrestha', role: 'Bridal Expert', avatar: 'https://randomuser.me/api/portraits/women/3.jpg', rating: 5.0, salonId: salon2.id } }),
        prisma.stylist.create({ data: { name: 'Sita Maharjan', role: 'Makeup Artist', avatar: 'https://randomuser.me/api/portraits/women/4.jpg', rating: 4.9, salonId: salon2.id } }),
    ]);

    const stylists3 = await Promise.all([
        prisma.stylist.create({ data: { name: 'Kamala Lama', role: 'Wellness Therapist', avatar: 'https://randomuser.me/api/portraits/women/5.jpg', rating: 4.8, salonId: salon3.id } }),
        prisma.stylist.create({ data: { name: 'Deepak Tamang', role: 'Massage Expert', avatar: 'https://randomuser.me/api/portraits/men/2.jpg', rating: 4.7, salonId: salon3.id } }),
        prisma.stylist.create({ data: { name: 'Rekha Limbu', role: 'Facial Specialist', avatar: 'https://randomuser.me/api/portraits/women/6.jpg', rating: 4.9, salonId: salon3.id } }),
    ]);

    const stylists4 = await Promise.all([
        prisma.stylist.create({ data: { name: 'Bikash Rai', role: 'Master Stylist', avatar: 'https://randomuser.me/api/portraits/men/3.jpg', rating: 4.8, salonId: salon4.id } }),
        prisma.stylist.create({ data: { name: 'Sabina Magar', role: 'Color Specialist', avatar: 'https://randomuser.me/api/portraits/women/7.jpg', rating: 4.6, salonId: salon4.id } }),
    ]);

    const stylists5 = await Promise.all([
        prisma.stylist.create({ data: { name: 'Nisha Karki', role: 'Nail Artist', avatar: 'https://randomuser.me/api/portraits/women/8.jpg', rating: 4.7, salonId: salon5.id } }),
        prisma.stylist.create({ data: { name: 'Pooja Basnet', role: 'Nail Technician', avatar: 'https://randomuser.me/api/portraits/women/9.jpg', rating: 4.5, salonId: salon5.id } }),
    ]);
    console.log(`✅ Created stylists for all salons`);

    // =====================
    // CREATE STAFF SCHEDULES
    // =====================
    const allStylists = [...stylists1, ...stylists2, ...stylists3, ...stylists4, ...stylists5];
    for (const stylist of allStylists) {
        for (let day = 1; day <= 6; day++) { // Monday to Saturday
            await prisma.staffSchedule.create({
                data: {
                    stylistId: stylist.id,
                    dayOfWeek: day,
                    startTime: '09:00',
                    endTime: day === 6 ? '17:00' : '19:00', // Saturday shorter hours
                    isWorking: true
                }
            });
        }
        // Sunday off
        await prisma.staffSchedule.create({
            data: {
                stylistId: stylist.id,
                dayOfWeek: 0,
                startTime: '00:00',
                endTime: '00:00',
                isWorking: false
            }
        });
    }
    console.log(`✅ Created staff schedules`);

    // =====================
    // CREATE APPOINTMENTS (Past and Future)
    // =====================
    const now = new Date();
    const appointments = [];

    // Past appointments (last 30 days) - for analytics
    for (let i = 30; i >= 1; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // 3-8 appointments per day
        const numAppointments = Math.floor(Math.random() * 6) + 3;
        
        for (let j = 0; j < numAppointments; j++) {
            const customer = customers[Math.floor(Math.random() * customers.length)];
            const salon = [salon1, salon2, salon3, salon4, salon5][Math.floor(Math.random() * 5)];
            const services = salon.id === salon1.id ? services1 : 
                            salon.id === salon2.id ? services2 :
                            salon.id === salon3.id ? services3 :
                            salon.id === salon4.id ? services4 : services5;
            const service = services[Math.floor(Math.random() * services.length)];
            const stylists = salon.id === salon1.id ? stylists1 :
                            salon.id === salon2.id ? stylists2 :
                            salon.id === salon3.id ? stylists3 :
                            salon.id === salon4.id ? stylists4 : stylists5;
            const stylist = stylists[Math.floor(Math.random() * stylists.length)];
            
            const hour = 9 + Math.floor(Math.random() * 9); // 9 AM to 6 PM
            date.setHours(hour, 0, 0, 0);

            appointments.push({
                date: new Date(date),
                status: 'COMPLETED' as const,
                price: service.price,
                userId: customer.id,
                salonId: salon.id,
                serviceId: service.id,
                stylistId: stylist.id
            });
        }
    }

    // Today's appointments
    const todayAppointments = [
        { hour: 9, customer: customers[0], service: services1[0], stylist: stylists1[0], salon: salon1, status: 'COMPLETED' as const },
        { hour: 10, customer: customers[1], service: services1[1], stylist: stylists1[1], salon: salon1, status: 'COMPLETED' as const },
        { hour: 11, customer: customers[2], service: services1[5], stylist: stylists1[2], salon: salon1, status: 'CONFIRMED' as const },
        { hour: 13, customer: customers[3], service: services1[3], stylist: stylists1[0], salon: salon1, status: 'CONFIRMED' as const },
        { hour: 14, customer: customers[4], service: services1[6], stylist: stylists1[2], salon: salon1, status: 'CONFIRMED' as const },
        { hour: 15, customer: customers[5], service: services1[0], stylist: stylists1[1], salon: salon1, status: 'CONFIRMED' as const },
        { hour: 16, customer: customers[6], service: services1[2], stylist: stylists1[0], salon: salon1, status: 'CONFIRMED' as const },
    ];

    for (const apt of todayAppointments) {
        const date = new Date(now);
        date.setHours(apt.hour, 0, 0, 0);
        appointments.push({
            date,
            status: apt.status,
            price: apt.service.price,
            userId: apt.customer.id,
            salonId: apt.salon.id,
            serviceId: apt.service.id,
            stylistId: apt.stylist.id
        });
    }

    // Future appointments (next 7 days)
    for (let i = 1; i <= 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        
        const numAppointments = Math.floor(Math.random() * 5) + 2;
        
        for (let j = 0; j < numAppointments; j++) {
            const customer = customers[Math.floor(Math.random() * customers.length)];
            const service = services1[Math.floor(Math.random() * services1.length)];
            const stylist = stylists1[Math.floor(Math.random() * stylists1.length)];
            
            const hour = 9 + Math.floor(Math.random() * 9);
            date.setHours(hour, 0, 0, 0);

            appointments.push({
                date: new Date(date),
                status: 'CONFIRMED' as const,
                price: service.price,
                userId: customer.id,
                salonId: salon1.id,
                serviceId: service.id,
                stylistId: stylist.id
            });
        }
    }

    await prisma.appointment.createMany({ data: appointments });
    console.log(`✅ Created ${appointments.length} appointments`);

    // =====================
    // CREATE REVIEWS
    // =====================
    const reviewComments = [
        'Amazing experience! The staff was so professional and friendly.',
        'Best salon in town! Will definitely come back.',
        'Loved the ambiance and the service. Highly recommended!',
        'Great value for money. My hair looks fantastic.',
        'The massage was so relaxing. I feel like a new person!',
        'Perfect bridal makeup! Everyone loved my look.',
        'Very skilled stylists. They understood exactly what I wanted.',
        'Clean, modern salon with excellent service.',
        'The best haircut I have ever had. Thank you!',
        'Wonderful spa experience. Very relaxing atmosphere.'
    ];

    const reviews = [];
    const salons = [salon1, salon2, salon3, salon4, salon5];
    
    for (const salon of salons) {
        const numReviews = Math.floor(Math.random() * 10) + 5;
        for (let i = 0; i < numReviews; i++) {
            const customer = customers[Math.floor(Math.random() * customers.length)];
            const daysAgo = Math.floor(Math.random() * 60);
            const reviewDate = new Date(now);
            reviewDate.setDate(reviewDate.getDate() - daysAgo);
            
            reviews.push({
                rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
                comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
                date: reviewDate,
                userId: customer.id,
                salonId: salon.id
            });
        }
    }

    await prisma.review.createMany({ data: reviews });
    console.log(`✅ Created ${reviews.length} reviews`);

    // =====================
    // CREATE CUSTOMER HISTORY
    // =====================
    const preferences = [
        'Prefers natural looking styles',
        'Allergic to certain hair dyes',
        'Likes relaxing music during treatments',
        'Prefers female stylists',
        'Regular customer, likes consistency',
        'Sensitive scalp, use gentle products',
        'Prefers appointments in the morning',
        'VIP customer, offer special discounts'
    ];

    const customerHistories = [];
    for (const customer of customers) {
        const salon = salons[Math.floor(Math.random() * salons.length)];
        const visits = Math.floor(Math.random() * 15) + 1;
        const spent = visits * (Math.random() * 3000 + 1000);
        
        customerHistories.push({
            salonId: salon.id,
            userId: customer.id,
            preferences: preferences[Math.floor(Math.random() * preferences.length)],
            allergies: Math.random() > 0.7 ? 'Sensitive to ammonia-based products' : null,
            notes: `Loyal customer since ${2024 + Math.floor(Math.random() * 2)}`,
            totalVisits: visits,
            totalSpent: Math.round(spent),
            lastVisit: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
    }

    await prisma.customerHistory.createMany({ data: customerHistories });
    console.log(`✅ Created customer histories`);

    // =====================
    // CREATE PROMO CODES
    // =====================
    const promoCodes = [
        {
            code: 'GLAMNEW',
            description: '20% off for new customers',
            discountType: 'PERCENTAGE' as const,
            discountValue: 20,
            minPurchase: 500,
            maxUses: 100,
            usedCount: 45,
            validFrom: new Date('2026-01-01'),
            validUntil: new Date('2026-03-31'),
            isActive: true,
            salonId: salon1.id
        },
        {
            code: 'SAVE500',
            description: 'Rs. 500 off on orders above Rs. 2000',
            discountType: 'FIXED' as const,
            discountValue: 500,
            minPurchase: 2000,
            maxUses: 50,
            usedCount: 23,
            validFrom: new Date('2026-01-15'),
            validUntil: new Date('2026-02-28'),
            isActive: true,
            salonId: salon1.id
        },
        {
            code: 'BRIDAL25',
            description: '25% off bridal packages',
            discountType: 'PERCENTAGE' as const,
            discountValue: 25,
            minPurchase: 10000,
            maxUses: 20,
            usedCount: 8,
            validFrom: new Date('2026-01-01'),
            validUntil: new Date('2026-06-30'),
            isActive: true,
            salonId: salon2.id
        },
        {
            code: 'WELLNESS20',
            description: '20% off all spa treatments',
            discountType: 'PERCENTAGE' as const,
            discountValue: 20,
            minPurchase: 1500,
            maxUses: null,
            usedCount: 67,
            validFrom: new Date('2026-01-01'),
            validUntil: new Date('2026-12-31'),
            isActive: true,
            salonId: salon3.id
        },
        {
            code: 'NAILART15',
            description: '15% off nail art services',
            discountType: 'PERCENTAGE' as const,
            discountValue: 15,
            minPurchase: 800,
            maxUses: 100,
            usedCount: 34,
            validFrom: new Date('2026-01-01'),
            validUntil: new Date('2026-04-30'),
            isActive: true,
            salonId: salon5.id
        }
    ];

    await prisma.promoCode.createMany({ data: promoCodes });
    console.log(`✅ Created ${promoCodes.length} promo codes`);

    // =====================
    // CREATE NOTIFICATIONS
    // =====================
    const notifications = [
        { message: 'Your appointment tomorrow at 10:00 AM has been confirmed!', userId: customers[0].id },
        { message: 'Don\'t forget: You have a spa session today at 2:00 PM', userId: customers[1].id },
        { message: 'New offer! Get 20% off with code GLAMNEW', userId: customers[2].id },
        { message: 'Thank you for your visit! Please leave us a review.', userId: customers[3].id },
        { message: 'Your favorite stylist Sunita has new available slots this week!', userId: customers[4].id },
    ];

    for (const notif of notifications) {
        await prisma.notification.create({ data: notif });
    }
    console.log(`✅ Created notifications`);

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('📧 Login Credentials:');
    console.log('----------------------------');
    console.log('Admin:        admin@glamconnect.com / admin123');
    console.log('Salon Owner:  priya@luxesalon.com / password123');
    console.log('Salon Owner:  maya@blushstudio.com / password123');
    console.log('Salon Owner:  anjali@zenbeauty.com / password123');
    console.log('Customer:     emma.wilson@gmail.com / password123');
    console.log('----------------------------\n');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
