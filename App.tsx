import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { SalonListPage } from './pages/SalonListPage';
import { SalonProfilePage } from './pages/SalonProfilePage';
import { DashboardPage } from './pages/DashboardPage';
import { OffersPage } from './pages/OffersPage';
import { BlogPage } from './pages/BlogPage';
import { AuthPage } from './pages/AuthPage';
import { AdminPage } from './pages/AdminPage';
import { NearbySalonsPage } from './pages/NearbySalonsPage';
import { PriceComparisonPage } from './pages/PriceComparisonPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { SalonSetupPage } from './pages/SalonSetupPage';
import { BeautyAssistant } from './components/BeautyAssistant';
import { Salon, PageView } from './types';
import { salons as salonsApi } from './api/client';
import { CheckCircle } from 'lucide-react';
import { Button } from './components/Button';
import { io } from 'socket.io-client';
import { Toaster, toast } from 'sonner';
import { SOCKET_URL } from './api/config';

const socket = io(SOCKET_URL);

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageView>(PageView.LANDING);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Helper to get current user role
  const getUserRole = (): string | null => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) return JSON.parse(userStr).role;
    } catch {}
    return null;
  };

  // Helper to get current user ID
  const getUserId = (): string | null => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) return JSON.parse(userStr).id;
    } catch {}
    return null;
  };

  // Auto-redirect on app load based on role
  React.useEffect(() => {
    const role = getUserRole();
    if (role === 'ADMIN') {
      setCurrentPage(PageView.ADMIN);
    } else if (role === 'SALON_OWNER') {
      // Check if salon owner has a salon set up
      salonsApi.getMySalon().then(res => {
        if (res.data.hasSalon) {
          setCurrentPage(PageView.DASHBOARD);
        } else {
          setCurrentPage(PageView.SALON_SETUP);
        }
      }).catch(() => {
        setCurrentPage(PageView.SALON_SETUP);
      });
    }
  }, []);

  // Socket.IO: join user room and listen for notifications
  React.useEffect(() => {
    const userId = getUserId();
    if (userId) {
      socket.emit('join_user', userId);
    }

    socket.on('booking_confirmed', (data: any) => {
      toast.success(`Booking confirmed for ${data.serviceName}!`);
    });

    socket.on('booking_rejected', (data: any) => {
      toast.error(`Booking for ${data.serviceName} was rejected${data.reason ? ': ' + data.reason : ''}`);
    });

    socket.on('booking_rescheduled', (data: any) => {
      toast.info(`Booking for ${data.serviceName} has been rescheduled`);
    });

    socket.on('service_completed', (data: any) => {
      toast.success(`Your ${data.serviceName} at ${data.salonName} is complete! Leave a review 🌟`);
    });

    socket.on('booking_request', (data: any) => {
      toast.info(`New booking request from ${data.userName} for ${data.serviceName}`);
    });

    socket.on('new_notification', (data: any) => {
      // Show subtle notification toast for other events
      if (!['BOOKING_CONFIRMED', 'BOOKING_REJECTED', 'BOOKING_COMPLETED', 'BOOKING_REQUEST'].includes(data.type)) {
        toast(data.message);
      }
    });

    return () => {
      socket.off('booking_confirmed');
      socket.off('booking_rejected');
      socket.off('booking_rescheduled');
      socket.off('service_completed');
      socket.off('booking_request');
      socket.off('new_notification');
    };
  }, []);

  const handleSetCurrentPage = (page: PageView) => {
    const role = getUserRole();

    // Guard: Admin can only access Admin panel and Auth
    if (role === 'ADMIN' && ![PageView.ADMIN, PageView.AUTH].includes(page)) {
      setCurrentPage(PageView.ADMIN);
      setRefreshKey(prev => prev + 1);
      return;
    }

    // Guard: Salon Owner can only access Dashboard and Auth
    if (role === 'SALON_OWNER' && ![PageView.DASHBOARD, PageView.AUTH].includes(page)) {
      setCurrentPage(PageView.DASHBOARD);
      setRefreshKey(prev => prev + 1);
      return;
    }

    setCurrentPage(page);
    setRefreshKey(prev => prev + 1);
  };

  const handleSelectSalon = (salon: Salon) => {
    setSelectedSalon(salon);
    setCurrentPage(PageView.SALON_PROFILE);
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (currentPage) {
      case PageView.LANDING:
        return <LandingPage onNavigate={handleSetCurrentPage} />;

      case PageView.SALON_LIST:
        return <SalonListPage onSelectSalon={handleSelectSalon} />;

      case PageView.SALON_PROFILE:
        return selectedSalon ? (
          <SalonProfilePage
            salon={selectedSalon}
            onBack={() => handleSetCurrentPage(PageView.SALON_LIST)}
            onBookSuccess={() => handleSetCurrentPage(PageView.BOOKING_SUCCESS)}
          />
        ) : (
          <SalonListPage onSelectSalon={handleSelectSalon} />
        );

      case PageView.DASHBOARD:
        // Only salon owners can access dashboard
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.role === 'SALON_OWNER') {
            return <DashboardPage />;
          }
        }
        // Redirect non-salon-owners to home
        handleSetCurrentPage(PageView.LANDING);
        return <LandingPage onNavigate={handleSetCurrentPage} />;

      case PageView.OFFERS:
        return <OffersPage onSelectSalon={handleSelectSalon} />;

      case PageView.BLOG:
        return <BlogPage />;

      case PageView.AUTH:
        return <AuthPage onLoginSuccess={(page) => handleSetCurrentPage(page)} />;

      case PageView.ADMIN:
        // Only admins can access admin panel
        const adminUserStr = localStorage.getItem('user');
        if (adminUserStr) {
          const adminUser = JSON.parse(adminUserStr);
          if (adminUser.role === 'ADMIN') {
            return <AdminPage />;
          }
        }
        // Redirect non-admins to home
        handleSetCurrentPage(PageView.LANDING);
        return <LandingPage onNavigate={handleSetCurrentPage} />;

      case PageView.NEARBY_SALONS:
        return <NearbySalonsPage onSelectSalon={handleSelectSalon} />;

      case PageView.PRICE_COMPARISON:
        return <PriceComparisonPage onSelectSalon={handleSelectSalon} />;

      case PageView.MY_BOOKINGS:
        // Only logged-in users can view their bookings
        if (localStorage.getItem('token')) {
          return <MyBookingsPage />;
        }
        handleSetCurrentPage(PageView.AUTH);
        return <AuthPage onLoginSuccess={(page) => handleSetCurrentPage(page)} />;

      case PageView.SALON_SETUP:
        return (
          <SalonSetupPage
            onSetupComplete={() => handleSetCurrentPage(PageView.DASHBOARD)}
          />
        );
      case PageView.BOOKING_SUCCESS:
        return (
          <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-gray-50">
            <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md w-full border border-gray-100 animate-in zoom-in-95">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
              <p className="text-gray-500 mb-8">
                Your appointment has been successfully scheduled. We've sent a confirmation email with all the details.
              </p>
              <div className="space-y-3">
                <Button className="w-full" onClick={() => handleSetCurrentPage(PageView.MY_BOOKINGS)}>View My Bookings</Button>
                <Button variant="ghost" className="w-full" onClick={() => handleSetCurrentPage(PageView.LANDING)}>Return Home</Button>
              </div>
            </div>
          </div>
        );

      default:
        return <LandingPage onNavigate={handleSetCurrentPage} />;
    }
  };

  return (
    <Layout key={refreshKey} setCurrentPage={handleSetCurrentPage} currentPage={currentPage}>
      {renderPage()}
      <BeautyAssistant />
      <Toaster position="top-center" />
    </Layout>
  );
};

export default App;