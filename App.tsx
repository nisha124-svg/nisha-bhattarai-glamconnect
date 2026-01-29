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
import { BeautyAssistant } from './components/BeautyAssistant';
import { Salon, PageView } from './types';
import { CheckCircle } from 'lucide-react';
import { Button } from './components/Button';
import { io } from 'socket.io-client';
import { Toaster, toast } from 'sonner';

const socket = io('http://localhost:5000');

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageView>(PageView.LANDING);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  React.useEffect(() => {
    socket.on('booking_confirmed', (data: any) => {
      toast.success(`Booking confirmed for ${data.serviceName}!`);
      // Optionally navigate or update state
    });

    return () => {
      socket.off('booking_confirmed');
    };
  }, []);

  const handleSetCurrentPage = (page: PageView) => {
    setCurrentPage(page);
    // Refresh Layout to update user state
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
                <Button className="w-full" onClick={() => handleSetCurrentPage(PageView.DASHBOARD)}>View in Dashboard</Button>
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