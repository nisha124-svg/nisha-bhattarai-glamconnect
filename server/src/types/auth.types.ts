export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'USER' | 'ADMIN' | 'SALON_OWNER';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface TokenPayload {
  userId: string;
  role: string;
}
