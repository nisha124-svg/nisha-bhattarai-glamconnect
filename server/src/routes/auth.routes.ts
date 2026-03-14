import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Role } from '@prisma/client';
import prisma from '../config/database';
import { validateEmail, validatePassword, validateName, sanitizeInput } from '../utils/validation';
import { RegisterRequest, LoginRequest, AuthResponse, TokenPayload } from '../types/auth.types';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

const ownerApplicationDir = path.join(process.cwd(), 'uploads', 'owner-applications');
if (!fs.existsSync(ownerApplicationDir)) {
  fs.mkdirSync(ownerApplicationDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, ownerApplicationDir),
    filename: (_req, file, cb) => {
      const safeExt = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP, and PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6,
  },
});

/**
 * Register a new salon owner with application details and documents
 * POST /api/auth/register-owner
 */
router.post(
  '/register-owner',
  upload.fields([
    { name: 'ownershipProof', maxCount: 1 },
    { name: 'locationImages', maxCount: 5 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const { email, password, name, salonName, description } = req.body;

      if (!email || !password || !name || !salonName || !description) {
        return res.status(400).json({ message: 'All owner registration fields are required' });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const ownershipProofFile = files?.ownershipProof?.[0];
      const locationImageFiles = files?.locationImages || [];

      if (!ownershipProofFile) {
        return res.status(400).json({ message: 'Ownership proof document is required' });
      }

      if (locationImageFiles.length === 0) {
        return res.status(400).json({ message: 'At least one location image is required' });
      }

      const sanitizedEmail = sanitizeInput(email).toLowerCase();
      const sanitizedName = sanitizeInput(name);
      const sanitizedSalonName = sanitizeInput(salonName);
      const sanitizedDescription = sanitizeInput(description);

      if (!validateEmail(sanitizedEmail)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      if (!validateName(sanitizedName)) {
        return res.status(400).json({ message: 'Name must be at least 2 characters long' });
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.message });
      }

      const existingUser = await prisma.user.findUnique({ where: { email: sanitizedEmail } });
      if (existingUser) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const ownershipProofUrl = `${baseUrl}/uploads/owner-applications/${ownershipProofFile.filename}`;
      const locationImageUrls = locationImageFiles.map((file) => `${baseUrl}/uploads/owner-applications/${file.filename}`);

      const hashedPassword = await bcrypt.hash(password, 12);

      await prisma.user.create({
        data: {
          email: sanitizedEmail,
          password: hashedPassword,
          name: sanitizedName,
          role: Role.SALON_OWNER,
          isApproved: false,
          salonApplicationName: sanitizedSalonName,
          salonApplicationDescription: sanitizedDescription,
          ownershipProofUrl,
          locationImageUrls,
          applicationSubmittedAt: new Date(),
        },
      });

      return res.status(201).json({
        message:
          'Application submitted successfully. Admin will review your documents and you will receive approval or rejection by email.',
        pendingApproval: true,
      });
    } catch (error: any) {
      console.error('Salon owner registration error:', error);
      if (error?.message?.includes('Only JPG, PNG, WEBP, and PDF files are allowed')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Error submitting salon owner application. Please try again.' });
    }
  }
);

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
  try {
    const { email, password, name, role = 'USER' } = req.body;

    if (role === 'SALON_OWNER') {
      return res.status(400).json({
        message: 'Salon owners must submit the owner application form with required documents.',
      });
    }

    // Input validation
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const sanitizedName = sanitizeInput(name);

    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (!validateName(sanitizedName)) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userRole = (role as Role) || Role.USER;
    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        password: hashedPassword,
        name: sanitizedName,
        role: userRole,
        isApproved: userRole === Role.SALON_OWNER ? false : true
      }
    });

    // If salon owner, don't give token — they need admin approval first
    if (userRole === Role.SALON_OWNER) {
      return res.status(201).json({
        message: 'Registration successful! Your salon owner account is pending admin approval. You will be able to log in once approved.',
        pendingApproval: true
      });
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const tokenPayload: TokenPayload = { userId: user.id, role: user.role };
    const token = jwt.sign(tokenPayload, secret, { expiresIn: '7d' });

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error creating user. Please try again.' });
  }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase();

    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if salon owner is approved
    if (user.role === Role.SALON_OWNER && !user.isApproved) {
      return res.status(403).json({ 
        message: 'Your salon owner account is pending admin approval. Please wait for the admin to approve your account.',
        pendingApproval: true
      });
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const tokenPayload: TokenPayload = { userId: user.id, role: user.role };
    const token = jwt.sign(tokenPayload, secret, { expiresIn: '7d' });

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in. Please try again.' });
  }
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

/**
 * Verify token validity
 * POST /api/auth/verify
 */
router.post('/verify', authenticate, (req: AuthRequest, res: Response) => {
  res.json({ valid: true, userId: req.userId });
});

/**
 * Google OAuth Login/Register
 * POST /api/auth/google
 * Accepts Google OAuth token and creates/logs in user
 */
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { token, email, name, googleId } = req.body;

    if (!email || !name || !googleId) {
      return res.status(400).json({ message: 'Google authentication data is required' });
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const sanitizedName = sanitizeInput(name);

    // Check if user exists with this email
    let user = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    if (user) {
      // User exists - log them in
      // Update their name if it changed
      if (user.name !== sanitizedName) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name: sanitizedName }
        });
      }
    } else {
      // Create new user with Google OAuth
      // Generate a random password hash (user won't use it for login)
      const randomPassword = await bcrypt.hash(googleId + Date.now(), 12);
      
      user = await prisma.user.create({
        data: {
          email: sanitizedEmail,
          password: randomPassword,
          name: sanitizedName,
          role: Role.USER
        }
      });
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const tokenPayload: TokenPayload = { userId: user.id, role: user.role };
    const jwtToken = jwt.sign(tokenPayload, secret, { expiresIn: '7d' });

    const response: AuthResponse = {
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ message: 'Error with Google authentication. Please try again.' });
  }
});

/**
 * Facebook OAuth Login/Register
 * POST /api/auth/facebook
 * Accepts Facebook OAuth token and creates/logs in user
 */
router.post('/facebook', async (req: Request, res: Response) => {
  try {
    const { token, email, name, facebookId } = req.body;

    if (!email || !name || !facebookId) {
      return res.status(400).json({ message: 'Facebook authentication data is required' });
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const sanitizedName = sanitizeInput(name);

    // Check if user exists with this email
    let user = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    if (user) {
      // User exists - log them in
      if (user.name !== sanitizedName) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name: sanitizedName }
        });
      }
    } else {
      // Create new user with Facebook OAuth
      const randomPassword = await bcrypt.hash(facebookId + Date.now(), 12);
      
      user = await prisma.user.create({
        data: {
          email: sanitizedEmail,
          password: randomPassword,
          name: sanitizedName,
          role: Role.USER
        }
      });
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const tokenPayload: TokenPayload = { userId: user.id, role: user.role };
    const jwtToken = jwt.sign(tokenPayload, secret, { expiresIn: '7d' });

    const response: AuthResponse = {
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    res.status(500).json({ message: 'Error with Facebook authentication. Please try again.' });
  }
});

export default router;
