import { Salon, Appointment } from './types';

export const MOCK_SALONS: Salon[] = [
  {
    id: '1',
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
      { id: 's1', name: 'Signature Blowout', duration: 45, price: 55, category: 'Hair' },
      { id: 's2', name: 'Gel Manicure', duration: 60, price: 45, category: 'Nails' },
      { id: 's3', name: 'Hydrating Facial', duration: 90, price: 120, category: 'Spa' },
    ],
    stylists: [
      { id: 'st1', name: 'Sarah J.', role: 'Senior Stylist', avatar: 'https://picsum.photos/100/100?random=10', rating: 4.9 },
      { id: 'st2', name: 'Mike R.', role: 'Color Expert', avatar: 'https://picsum.photos/100/100?random=11', rating: 4.7 },
    ],
    reviews: [
      { id: 'r1', user: 'Emily W.', rating: 5, comment: 'Absolutely amazing service! Sarah is a wizard with hair.', date: '2023-10-15' },
    ]
  },
  {
    id: '2',
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
      { id: 's4', name: 'Bridal Trial', duration: 120, price: 150, category: 'Bridal' },
      { id: 's5', name: 'Full Glam Makeup', duration: 60, price: 95, category: 'Makeup' },
    ],
    stylists: [
      { id: 'st3', name: 'Jessica L.', role: 'Master Artist', avatar: 'https://picsum.photos/100/100?random=12', rating: 5.0 },
    ],
    reviews: [
      { id: 'r2', user: 'Amanda C.', rating: 5, comment: 'Made me feel like a princess on my big day!', date: '2023-11-02' },
    ]
  },
  {
    id: '3',
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
      { id: 's6', name: 'Acrylic Set', duration: 90, price: 65, category: 'Nails' },
      { id: 's7', name: 'Pedicure Deluxe', duration: 45, price: 50, category: 'Nails' },
    ],
    stylists: [
      { id: 'st4', name: 'Kim T.', role: 'Nail Technician', avatar: 'https://picsum.photos/100/100?random=13', rating: 4.8 },
    ],
    reviews: []
  },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'a1', salonName: 'Luxe & Glow Beauty Bar', serviceName: 'Signature Blowout', date: '2023-12-01', time: '10:00 AM', stylist: 'Sarah J.', price: 55, status: 'Completed' },
  { id: 'a2', salonName: 'Urban Nail Lounge', serviceName: 'Gel Manicure', date: '2023-12-15', time: '2:00 PM', stylist: 'Kim T.', price: 45, status: 'Confirmed' },
];

export const CATEGORIES = [
  { name: 'Hair', icon: 'Scissors', image: 'https://picsum.photos/200/200?random=50' },
  { name: 'Nails', icon: 'Hand', image: 'https://picsum.photos/200/200?random=51' },
  { name: 'Spa', icon: 'Sparkles', image: 'https://picsum.photos/200/200?random=52' },
  { name: 'Makeup', icon: 'Palette', image: 'https://picsum.photos/200/200?random=53' },
  { name: 'Bridal', icon: 'Heart', image: 'https://picsum.photos/200/200?random=54' },
];