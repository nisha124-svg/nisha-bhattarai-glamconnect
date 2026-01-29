import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const MOCK_SALONS = [
    {
        name: 'Luxe & Glow Beauty Bar',
        address: '123 Melrose Avenue, Los Angeles',
        rating: 4.8,
        reviewCount: 324,
        image: 'https://picsum.photos/800/600?random=1',
        gallery: [
            'https://picsum.photos/400/300?random=101',
            'https://picsum.photos/400/300?random=102',
            'https://picsum.photos/400/300?random=103',
        ],
        description: 'Experience premium pampering at Luxe & Glow. We specialize in organic facials, modern hair styling, and relaxing spa treatments designed to rejuvenate your spirit.',
        tags: ['Hair', 'Spa', 'Organic'],
        services: [
            { name: 'Signature Blowout', duration: 45, price: 55, category: 'Hair' },
            { name: 'Gel Manicure', duration: 60, price: 45, category: 'Nails' },
            { name: 'Hydrating Facial', duration: 90, price: 120, category: 'Spa' },
        ],
        stylists: [
            { name: 'Sarah J.', role: 'Senior Stylist', avatar: 'https://picsum.photos/100/100?random=10', rating: 4.9 },
            { name: 'Mike R.', role: 'Color Expert', avatar: 'https://picsum.photos/100/100?random=11', rating: 4.7 },
        ]
    },
    {
        name: 'Blush Bridal Studio',
        address: '45 Wedding Lane, Beverly Hills',
        rating: 4.9,
        reviewCount: 156,
        image: 'https://picsum.photos/800/600?random=2',
        gallery: [
            'https://picsum.photos/400/300?random=201',
            'https://picsum.photos/400/300?random=202',
        ],
        description: 'Specializing in bridal makeup and hair. Let us make your special day unforgettable with our team of expert artists.',
        tags: ['Bridal', 'Makeup', 'Hair'],
        services: [
            { name: 'Bridal Trial', duration: 120, price: 150, category: 'Bridal' },
            { name: 'Full Glam Makeup', duration: 60, price: 95, category: 'Makeup' },
        ],
        stylists: [
            { name: 'Jessica L.', role: 'Master Artist', avatar: 'https://picsum.photos/100/100?random=12', rating: 5.0 },
        ]
    },
    {
        name: 'Urban Nail Lounge',
        address: '789 Downtown Blvd, San Francisco',
        rating: 4.6,
        reviewCount: 542,
        image: 'https://picsum.photos/800/600?random=3',
        gallery: [
            'https://picsum.photos/400/300?random=301',
        ],
        description: 'The trendiest nail art in the city. Walk-ins welcome, but appointments recommended for our intricate designs.',
        tags: ['Nails', 'Art'],
        services: [
            { name: 'Acrylic Set', duration: 90, price: 65, category: 'Nails' },
            { name: 'Pedicure Deluxe', duration: 45, price: 50, category: 'Nails' },
        ],
        stylists: [
            { name: 'Kim T.', role: 'Nail Technician', avatar: 'https://picsum.photos/100/100?random=13', rating: 4.8 },
        ]
    },
];

async function main() {
    console.log('Start seeding ...');

    // Create a default user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'demo@example.com' },
        update: {},
        create: {
            email: 'demo@example.com',
            name: 'Demo User',
            password: hashedPassword,
        },
    });
    console.log(`Created user: ${user.name}`);

    // Create salons
    for (const salonData of MOCK_SALONS) {
        const salon = await prisma.salon.create({
            data: {
                name: salonData.name,
                address: salonData.address,
                rating: salonData.rating,
                reviewCount: salonData.reviewCount,
                image: salonData.image,
                gallery: salonData.gallery,
                description: salonData.description,
                tags: salonData.tags,
                services: {
                    create: salonData.services
                },
                stylists: {
                    create: salonData.stylists
                }
            }
        });
        console.log(`Created salon: ${salon.name}`);
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
