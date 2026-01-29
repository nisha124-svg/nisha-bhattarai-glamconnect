# Authentication System Documentation

## Overview
This project implements a secure JWT-based authentication system with role-based access control for the GlamConnect beauty salon booking platform.

## Features

### ✅ Implemented Features
- **User Registration** with email/password
- **User Login** with JWT tokens
- **Role-Based Authentication** (User and Salon Owner)
- **Secure Password Hashing** using bcrypt
- **Token-Based Sessions** (7-day expiration)
- **Input Validation** (client and server-side)
- **Protected Routes** with authentication middleware
- **Automatic Token Refresh** handling
- **Email Confirmation** for bookings

### 🔐 Security Features
- Passwords hashed with bcrypt (salt rounds: 12)
- JWT tokens with 7-day expiration
- Secure password requirements:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
- Input sanitization and validation
- SQL injection protection via Prisma ORM
- XSS protection through input validation

## Architecture

### Backend Structure
```
server/src/
├── config/
│   └── database.ts          # Centralized Prisma client
├── middleware/
│   └── auth.middleware.ts   # JWT authentication middleware
├── routes/
│   ├── auth.routes.ts       # Authentication endpoints
│   ├── appointment.routes.ts # Booking endpoints
│   └── salon.routes.ts      # Salon endpoints
├── types/
│   └── auth.types.ts        # TypeScript interfaces
├── utils/
│   └── validation.ts        # Input validation utilities
└── index.ts                 # Server entry point
```

### Frontend Structure
```
├── api/
│   └── client.ts            # API client with interceptors
├── pages/
│   └── AuthPage.tsx         # Login/Register UI
└── types.ts                 # TypeScript types
```

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123",
  "name": "John Doe",
  "role": "USER" // or "SALON_OWNER"
}

Response: {
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}

Response: {
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

#### Get Current User Profile
```http
GET /api/auth/me
Authorization: Bearer <token>

Response: {
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### Verify Token
```http
POST /api/auth/verify
Authorization: Bearer <token>

Response: {
  "valid": true,
  "userId": "uuid"
}
```

### Protected Endpoints

#### Create Appointment
```http
POST /api/appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "salonId": "salon-uuid",
  "serviceId": "service-uuid",
  "stylistId": "stylist-uuid",
  "date": "2024-12-25T10:00:00Z",
  "price": 50.00
}
```

#### Get My Appointments
```http
GET /api/appointments/my-appointments
Authorization: Bearer <token>
```

#### Cancel Appointment
```http
PATCH /api/appointments/:id/cancel
Authorization: Bearer <token>
```

## Setup Instructions

### 1. Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
cd server
cp .env.example .env
```

Update the following variables:
- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: Strong random secret key
- `EMAIL_*`: Email service credentials

### 2. Database Setup
```bash
cd server
npm install
npx prisma migrate dev
npx prisma generate
```

### 3. Run the Application

Backend:
```bash
cd server
npm run dev
```

Frontend:
```bash
npm run dev
```

## Usage Examples

### Client-Side Authentication

#### Login
```typescript
import { auth } from './api/client';

const handleLogin = async (email: string, password: string) => {
  try {
    const response = await auth.login({ email, password });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    // Redirect to dashboard
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

#### Register
```typescript
const handleRegister = async (email: string, password: string, name: string, isSalonOwner: boolean) => {
  try {
    const response = await auth.register({
      email,
      password,
      name,
      role: isSalonOwner ? 'SALON_OWNER' : 'USER'
    });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    // Redirect to dashboard
  } catch (error) {
    console.error('Registration failed:', error);
  }
};
```

#### Protected API Call
```typescript
import { appointments } from './api/client';

const createAppointment = async (appointmentData) => {
  try {
    // Token automatically attached by interceptor
    const response = await appointments.create(appointmentData);
    console.log('Appointment created:', response.data);
  } catch (error) {
    console.error('Failed to create appointment:', error);
  }
};
```

## Error Handling

### Common Error Responses

| Status Code | Error Message | Description |
|------------|---------------|-------------|
| 400 | Invalid email format | Email validation failed |
| 400 | Password must be at least 8 characters | Password too short |
| 401 | Invalid email or password | Wrong credentials |
| 401 | Token has expired | JWT token expired |
| 401 | Invalid token | Malformed or invalid token |
| 409 | User already exists | Email already registered |
| 500 | Server configuration error | Missing JWT_SECRET |

## Best Practices

### Security
1. **Never commit `.env` files** - Keep sensitive data secure
2. **Use strong JWT secrets** - Generate using: `openssl rand -base64 32`
3. **Implement rate limiting** - Prevent brute force attacks (TODO)
4. **Add HTTPS in production** - Encrypt data in transit
5. **Regular security audits** - Keep dependencies updated

### Code Quality
1. **TypeScript strict mode** - Type safety throughout
2. **Error logging** - Use proper logging service in production
3. **Input validation** - Both client and server side
4. **Database connection pooling** - Single Prisma instance
5. **Graceful shutdown** - Handle process termination

## Future Enhancements

- [ ] OAuth integration (Google, Facebook)
- [ ] Two-factor authentication (2FA)
- [ ] Password reset via email
- [ ] Remember me functionality
- [ ] Rate limiting for auth endpoints
- [ ] Account email verification
- [ ] Session management dashboard
- [ ] Refresh token mechanism
- [ ] Audit logs for authentication events

## Troubleshooting

### Token Issues
**Problem**: "Invalid token" errors
**Solution**: Clear localStorage and re-login

### Database Connection
**Problem**: Cannot connect to database
**Solution**: Verify DATABASE_URL in .env file

### CORS Errors
**Problem**: Frontend can't reach backend
**Solution**: Ensure CORS_ORIGIN matches frontend URL

## Contributing
When adding new protected routes:
1. Import the `authenticate` middleware
2. Apply it to the route: `router.get('/protected', authenticate, handler)`
3. Use `req.userId` to access the authenticated user's ID
4. Add proper error handling and validation

## License
MIT License - See LICENSE file for details
