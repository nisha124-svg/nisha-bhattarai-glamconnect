import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Check, Facebook, Chrome, Clock } from 'lucide-react';
import { Button } from '../components/Button';
import { PageView } from '../types';

interface AuthPageProps {
  onLoginSuccess: (page: PageView) => void;
}

import { auth, salons } from '../api/client';

// Declare global for Google OAuth
declare global {
  interface Window {
    google?: any;
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect based on role after login
  const redirectByRole = async (user: { role: string }) => {
    if (user.role === 'ADMIN') {
      onLoginSuccess(PageView.ADMIN);
    } else if (user.role === 'SALON_OWNER') {
      try {
        const res = await salons.getMySalon();
        if (res.data.hasSalon) {
          onLoginSuccess(PageView.DASHBOARD);
        } else {
          onLoginSuccess(PageView.SALON_SETUP);
        }
      } catch {
        onLoginSuccess(PageView.SALON_SETUP);
      }
    } else {
      onLoginSuccess(PageView.LANDING);
    }
  };

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSalonOwner, setIsSalonOwner] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingApprovalMessage, setPendingApprovalMessage] = useState('');

  // Client-side validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password || (!isLogin && !name)) {
      setError('All fields are required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!isLogin) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }

      if (name.trim().length < 2) {
        setError('Name must be at least 2 characters long');
        return;
      }
    }

    setIsLoading(true);

    try {
      let response;
      if (isLogin) {
        response = await auth.login({ email, password });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        redirectByRole(response.data.user);
      } else {
        response = await auth.register({
          email,
          password,
          name,
          role: isSalonOwner ? 'SALON_OWNER' : 'USER'
        });
        
        // Check if this is a pending approval response
        if (response.data.pendingApproval) {
          setError('');
          setPendingApprovalMessage(response.data.message);
          return;
        }
        
        // After successful registration, redirect to login
        setIsLogin(true);
        setPassword('');
        setError('');
        alert('Account created successfully! Please login to continue.');
      }
    } catch (err: any) {
      if (err.response?.data?.pendingApproval) {
        setError('');
        setPendingApprovalMessage(err.response.data.message);
      } else {
        setError(err.response?.data?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setIsSalonOwner(false);
  };

  // Google OAuth handler
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');

      // For demo purposes, simulate Google OAuth flow
      // In production, you would integrate with Google Identity Services
      const mockGoogleUser = {
        token: 'google-oauth-token',
        email: 'google.user@gmail.com',
        name: 'Google User',
        googleId: 'google-' + Date.now()
      };

      // Check if Google SDK is loaded
      if (window.google?.accounts?.id) {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to demo mode
            performGoogleAuth(mockGoogleUser);
          }
        });
      } else {
        // Demo mode - simulate successful Google auth
        performGoogleAuth(mockGoogleUser);
      }
    } catch (err: any) {
      setError('Google login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const performGoogleAuth = async (userData: { token: string; email: string; name: string; googleId: string }) => {
    try {
      const response = await auth.googleLogin(userData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      redirectByRole(response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Facebook OAuth handler
  const handleFacebookLogin = async () => {
    try {
      setIsLoading(true);
      setError('');

      // For demo purposes, simulate Facebook OAuth flow
      // In production, you would integrate with Facebook SDK
      const mockFacebookUser = {
        token: 'facebook-oauth-token',
        email: 'facebook.user@email.com',
        name: 'Facebook User',
        facebookId: 'facebook-' + Date.now()
      };

      // Check if Facebook SDK is loaded
      if (window.FB) {
        window.FB.login((response: any) => {
          if (response.authResponse) {
            window.FB.api('/me', { fields: 'name,email' }, async (fbUser: any) => {
              await performFacebookAuth({
                token: response.authResponse.accessToken,
                email: fbUser.email || mockFacebookUser.email,
                name: fbUser.name,
                facebookId: fbUser.id
              });
            });
          } else {
            // User cancelled or error - use demo mode
            performFacebookAuth(mockFacebookUser);
          }
        }, { scope: 'email' });
      } else {
        // Demo mode - simulate successful Facebook auth
        performFacebookAuth(mockFacebookUser);
      }
    } catch (err: any) {
      setError('Facebook login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const performFacebookAuth = async (userData: { token: string; email: string; name: string; facebookId: string }) => {
    try {
      const response = await auth.facebookLogin(userData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      redirectByRole(response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Facebook authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show pending approval screen
  if (pendingApprovalMessage) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center bg-white rounded-3xl shadow-2xl border border-gray-100 p-10">
          <div className="mx-auto w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
            <Clock className="h-10 w-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Account Pending Approval</h2>
          <p className="text-gray-600 mb-6">{pendingApprovalMessage}</p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800">
              <strong>What happens next?</strong><br />
              Our admin team will review your application and approve your account. Once approved, you'll be able to log in and set up your salon profile.
            </p>
          </div>
          <button
            onClick={() => {
              setPendingApprovalMessage('');
              setIsLogin(true);
              setEmail('');
              setPassword('');
              setName('');
              setIsSalonOwner(false);
            }}
            className="w-full py-3 px-4 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 min-h-[600px]">

        {/* Left Side - Image & Branding */}
        <div className="hidden md:flex md:w-1/2 bg-pink-600 relative flex-col justify-between p-12 text-white">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1522335789203-abd6538d8ad3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
              alt="Beauty Salon"
              className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/90 to-purple-800/80"></div>
          </div>

          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-4">GlamConnect</h1>
            <p className="text-pink-100 text-lg">Your beauty journey starts here.</p>
          </div>

          <div className="relative z-10">
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-white/20 p-2 rounded-lg mr-4 backdrop-blur-sm">
                  <Check className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Easy Booking</h3>
                  <p className="text-pink-100 text-sm">Find and book top-rated salons in seconds.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-white/20 p-2 rounded-lg mr-4 backdrop-blur-sm">
                  <Check className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Exclusive Offers</h3>
                  <p className="text-pink-100 text-sm">Get access to special discounts and loyalty rewards.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-white/20 p-2 rounded-lg mr-4 backdrop-blur-sm">
                  <Check className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">AI Beauty Assistant</h3>
                  <p className="text-pink-100 text-sm">Get personalized beauty tips and recommendations.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-sm text-pink-200">
            © 2024 GlamConnect. All rights reserved.
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-gray-50/50">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {isLogin ? 'Welcome Back!' : 'Create Account'}
              </h2>
              <p className="text-gray-500">
                {isLogin ? 'Please enter your details to sign in.' : 'Join us and start glowing today.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition bg-white"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition bg-white"
                    placeholder="name@example.com"
                  />
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition bg-white"
                    placeholder="••••••••"
                  />
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="flex justify-between items-center text-sm">
                  <label className="flex items-center text-gray-600 cursor-pointer">
                    <input type="checkbox" className="rounded text-pink-500 focus:ring-pink-500 border-gray-300 mr-2" />
                    Remember me
                  </label>
                  <button type="button" className="text-pink-600 font-medium hover:text-pink-700">
                    Forgot Password?
                  </button>
                </div>
              )}

              {!isLogin && (
                <label className="flex items-center text-sm text-gray-600 cursor-pointer bg-pink-50 p-3 rounded-lg border border-pink-100">
                  <input
                    type="checkbox"
                    className="rounded text-pink-500 focus:ring-pink-500 border-gray-300 mr-2"
                    checked={isSalonOwner}
                    onChange={(e) => setIsSalonOwner(e.target.checked)}
                  />
                  <span>I am a Salon Owner/Professional</span>
                </label>
              )}

              <Button
                type="submit"
                className="w-full shadow-lg shadow-pink-200 py-3 text-lg"
                disabled={isLoading}
              >
                {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button 
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="flex justify-center items-center py-2.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition text-gray-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Chrome className="h-5 w-5 mr-2 text-red-500" /> Google
                </button>
                <button 
                  onClick={handleFacebookLogin}
                  disabled={isLoading}
                  className="flex justify-center items-center py-2.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition text-gray-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Facebook className="h-5 w-5 mr-2 text-blue-600" /> Facebook
                </button>
              </div>
            </div>

            <div className="mt-8 text-center text-sm text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={toggleMode}
                className="font-bold text-pink-600 hover:text-pink-700"
                type="button"
              >
                {isLogin ? "Sign up for free" : "Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};