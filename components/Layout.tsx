import React from 'react';
import { Menu, X, User, Heart, Sparkles, LayoutDashboard, ChevronDown, LogOut, Shield, Navigation, DollarSign, CalendarCheck } from 'lucide-react';
import { PageView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  setCurrentPage: (page: PageView) => void;
  currentPage: PageView;
}

export const Layout: React.FC<LayoutProps> = ({ children, setCurrentPage, currentPage }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);
  const [user, setUser] = React.useState<{ name: string; email: string; role: string } | null>(null);

  React.useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsProfileDropdownOpen(false);
    setCurrentPage(PageView.LANDING);
  };

  const profileDropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const isSalonOwner = user?.role === 'SALON_OWNER';
  const isCustomer = !isAdmin && !isSalonOwner; // regular user or guest

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo */}
            <div 
              className="flex-shrink-0 flex items-center cursor-pointer" 
              onClick={() => {
                if (isAdmin) setCurrentPage(PageView.ADMIN);
                else if (isSalonOwner) setCurrentPage(PageView.DASHBOARD);
                else setCurrentPage(PageView.LANDING);
              }}
            >
              <Sparkles className="h-8 w-8 text-pink-500 mr-2" />
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
                GlamConnect
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              {/* Admin nav — only Admin Panel */}
              {isAdmin && (
                <button 
                  onClick={() => setCurrentPage(PageView.ADMIN)}
                  className={`${currentPage === PageView.ADMIN ? 'text-purple-600 font-semibold' : 'text-gray-600'} hover:text-purple-500 transition flex items-center gap-1`}
                >
                  <Shield className="h-4 w-4" />
                  Admin Panel
                </button>
              )}

              {/* Salon Owner nav — only Dashboard */}
              {isSalonOwner && (
                <button 
                  onClick={() => setCurrentPage(PageView.DASHBOARD)}
                  className={`${currentPage === PageView.DASHBOARD ? 'text-pink-600 font-semibold' : 'text-gray-600'} hover:text-pink-500 transition flex items-center gap-1`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Salon Dashboard
                </button>
              )}

              {/* Customer / Guest nav — full browsing links */}
              {isCustomer && (
                <>
                  <button 
                    onClick={() => setCurrentPage(PageView.LANDING)}
                    className={`${currentPage === PageView.LANDING ? 'text-pink-600 font-semibold' : 'text-gray-600'} hover:text-pink-500 transition`}
                  >
                    Home
                  </button>
                  <button 
                    onClick={() => setCurrentPage(PageView.SALON_LIST)}
                    className={`${currentPage === PageView.SALON_LIST ? 'text-pink-600 font-semibold' : 'text-gray-600'} hover:text-pink-500 transition`}
                  >
                    Find Salon
                  </button>
                  <button 
                    onClick={() => setCurrentPage(PageView.NEARBY_SALONS)}
                    className={`${currentPage === PageView.NEARBY_SALONS ? 'text-pink-600 font-semibold' : 'text-gray-600'} hover:text-pink-500 transition flex items-center gap-1`}
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Nearby
                  </button>
                  <button 
                    onClick={() => setCurrentPage(PageView.PRICE_COMPARISON)}
                    className={`${currentPage === PageView.PRICE_COMPARISON ? 'text-pink-600 font-semibold' : 'text-gray-600'} hover:text-pink-500 transition flex items-center gap-1`}
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    Compare
                  </button>
                  <button 
                    onClick={() => setCurrentPage(PageView.OFFERS)}
                    className={`${currentPage === PageView.OFFERS ? 'text-pink-600 font-semibold' : 'text-gray-600'} hover:text-pink-500 transition`}
                  >
                    Offers
                  </button>
                  <button 
                    onClick={() => setCurrentPage(PageView.BLOG)}
                    className={`${currentPage === PageView.BLOG ? 'text-pink-600 font-semibold' : 'text-gray-600'} hover:text-pink-500 transition`}
                  >
                    Blog
                  </button>
                </>
              )}
            </div>

            {/* Right Side Icons */}
            <div className="hidden md:flex items-center space-x-4">
              {/* My Bookings — only for regular customers */}
              {user && isCustomer && (
                <button 
                  onClick={() => setCurrentPage(PageView.MY_BOOKINGS)}
                  className={`p-2 rounded-full transition ${currentPage === PageView.MY_BOOKINGS ? 'text-pink-600 bg-pink-50' : 'text-gray-500 hover:text-pink-600 hover:bg-pink-50'}`}
                  title="My Bookings"
                >
                  <CalendarCheck className="h-6 w-6" />
                </button>
              )}
              {isCustomer && (
                <button className="p-2 rounded-full text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition">
                  <Heart className="h-6 w-6" />
                </button>
              )}
              
              {user ? (
                <div className="relative" ref={profileDropdownRef}>
                  <button 
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className={`flex items-center px-4 py-2 rounded-full font-medium hover:opacity-90 transition space-x-2 ${
                      isAdmin ? 'bg-purple-50 text-purple-600 hover:bg-purple-100' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                      isAdmin ? 'bg-gradient-to-br from-purple-400 to-indigo-500' : 'bg-gradient-to-br from-pink-400 to-rose-500'
                    }`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[120px] truncate">{user.name}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        <span className={`inline-block text-xs mt-1 font-medium px-2 py-0.5 rounded-full ${
                          isAdmin ? 'bg-purple-100 text-purple-700' : isSalonOwner ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-600'
                        }`}>
                          {isAdmin ? 'Admin' : isSalonOwner ? 'Salon Owner' : 'Customer'}
                        </span>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => setCurrentPage(PageView.AUTH)}
                  className="flex items-center px-4 py-2 rounded-full bg-pink-50 text-pink-600 font-medium hover:bg-pink-100 transition"
                >
                  <User className="h-5 w-5 mr-2" />
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-pink-600 hover:bg-pink-50 focus:outline-none"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-pink-100">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {/* Admin mobile nav */}
              {isAdmin && (
                <button 
                  onClick={() => { setCurrentPage(PageView.ADMIN); setIsMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-purple-700 hover:text-purple-600 hover:bg-purple-50"
                >
                  🛡️ Admin Panel
                </button>
              )}

              {/* Salon Owner mobile nav */}
              {isSalonOwner && (
                <button 
                  onClick={() => { setCurrentPage(PageView.DASHBOARD); setIsMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50"
                >
                  📊 Salon Dashboard
                </button>
              )}

              {/* Customer / Guest mobile nav */}
              {isCustomer && (
                <>
                  <button 
                    onClick={() => { setCurrentPage(PageView.LANDING); setIsMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50"
                  >
                    Home
                  </button>
                  <button 
                    onClick={() => { setCurrentPage(PageView.SALON_LIST); setIsMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50"
                  >
                    Find Salon
                  </button>
                  <button 
                    onClick={() => { setCurrentPage(PageView.NEARBY_SALONS); setIsMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50"
                  >
                    📍 Nearby Salons
                  </button>
                  <button 
                    onClick={() => { setCurrentPage(PageView.PRICE_COMPARISON); setIsMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50"
                  >
                    💰 Compare Prices
                  </button>
                  <button 
                    onClick={() => { setCurrentPage(PageView.OFFERS); setIsMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50"
                  >
                    Offers
                  </button>
                  <button 
                    onClick={() => { setCurrentPage(PageView.BLOG); setIsMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50"
                  >
                    Blog
                  </button>
                  {user && (
                    <button 
                      onClick={() => { setCurrentPage(PageView.MY_BOOKINGS); setIsMenuOpen(false); }}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50"
                    >
                      📅 My Bookings
                    </button>
                  )}
                </>
              )}
              
              {user ? (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="px-3 py-2 mb-2">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <span className={`inline-block text-xs mt-1 font-medium px-2 py-0.5 rounded-full ${
                      isAdmin ? 'bg-purple-100 text-purple-700' : isSalonOwner ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-600'
                    }`}>
                      {isAdmin ? 'Admin' : isSalonOwner ? 'Salon Owner' : 'Customer'}
                    </span>
                  </div>
                  <button 
                    onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => { setCurrentPage(PageView.AUTH); setIsMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-pink-600 bg-pink-50 mt-4"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-pink-100 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center mb-4">
                <Sparkles className="h-6 w-6 text-pink-500 mr-2" />
                <span className="text-xl font-bold text-gray-900">GlamConnect</span>
              </div>
              <p className="text-gray-500 text-sm">
                Book the best beauty professionals near you with just a click. Simple, fast, and beautiful.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Services</h3>
              <ul className="space-y-2">
                <li><button className="text-gray-500 hover:text-pink-500">Hair Styling</button></li>
                <li><button className="text-gray-500 hover:text-pink-500">Nail Art</button></li>
                <li><button className="text-gray-500 hover:text-pink-500">Spa & Facial</button></li>
                <li><button className="text-gray-500 hover:text-pink-500">Bridal</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Company</h3>
              <ul className="space-y-2">
                <li><button className="text-gray-500 hover:text-pink-500">About Us</button></li>
                <li><button className="text-gray-500 hover:text-pink-500">Careers</button></li>
                <li><button onClick={() => setCurrentPage(PageView.BLOG)} className="text-gray-500 hover:text-pink-500">Blog</button></li>
                <li><button className="text-gray-500 hover:text-pink-500">Contact</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><button className="text-gray-500 hover:text-pink-500">Privacy Policy</button></li>
                <li><button className="text-gray-500 hover:text-pink-500">Terms of Service</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-8 flex justify-between items-center">
            <p className="text-gray-400 text-sm">© 2024 GlamConnect. All rights reserved.</p>
            <div className="flex space-x-6">
              {/* Social placeholders */}
              <div className="h-5 w-5 bg-gray-200 rounded-full hover:bg-pink-400 cursor-pointer transition"></div>
              <div className="h-5 w-5 bg-gray-200 rounded-full hover:bg-pink-400 cursor-pointer transition"></div>
              <div className="h-5 w-5 bg-gray-200 rounded-full hover:bg-pink-400 cursor-pointer transition"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};