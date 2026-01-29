export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
  category: 'Hair' | 'Nails' | 'Spa' | 'Makeup' | 'Bridal';
}

export interface Stylist {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
}

export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Salon {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  image: string;
  gallery: string[];
  description: string;
  services: Service[];
  stylists: Stylist[];
  reviews: Review[];
  tags: string[];
}

export interface Appointment {
  id: string;
  salonName: string;
  serviceName: string;
  date: string;
  time: string;
  stylist: string;
  price: number;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
}

export enum PageView {
  LANDING = 'LANDING',
  SALON_LIST = 'SALON_LIST',
  SALON_PROFILE = 'SALON_PROFILE',
  DASHBOARD = 'DASHBOARD',
  BOOKING_SUCCESS = 'BOOKING_SUCCESS',
  OFFERS = 'OFFERS',
  BLOG = 'BLOG',
  AUTH = 'AUTH'
}