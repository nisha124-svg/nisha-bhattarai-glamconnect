import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import authRoutes from './routes/auth.routes';
import salonRoutes from './routes/salon.routes';
import appointmentRoutes from './routes/appointment.routes';
import dashboardRoutes from './routes/dashboard.routes';
import serviceRoutes from './routes/service.routes';
import customerRoutes from './routes/customer.routes';
import promoRoutes from './routes/promo.routes';
import adminRoutes from './routes/admin.routes';
import paymentRoutes from './routes/payment.routes';
import loyaltyRoutes from './routes/loyalty.routes';
import membershipRoutes from './routes/membership.routes';
import chatRoutes from './routes/chat.routes';
import reviewRoutes from './routes/review.routes';
import notificationRoutes from './routes/notification.routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/salons', salonRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);

// Socket.io connection with room management
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join user's personal room for targeted notifications
    socket.on('join_user', (userId: string) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined personal room`);
    });

    // Join a salon chat room
    socket.on('join_salon_chat', (salonId: string) => {
        socket.join(`salon_${salonId}`);
        console.log(`Socket ${socket.id} joined salon_${salonId} chat`);
    });

    // Leave a salon chat room
    socket.on('leave_salon_chat', (salonId: string) => {
        socket.leave(`salon_${salonId}`);
        console.log(`Socket ${socket.id} left salon_${salonId} chat`);
    });

    // Handle typing indicators
    socket.on('typing', (data: { salonId: string; userName: string }) => {
        socket.to(`salon_${data.salonId}`).emit('user_typing', {
            userName: data.userName,
            salonId: data.salonId,
        });
    });

    socket.on('stop_typing', (data: { salonId: string }) => {
        socket.to(`salon_${data.salonId}`).emit('user_stop_typing', {
            salonId: data.salonId,
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
