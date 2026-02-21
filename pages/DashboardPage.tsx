import React, { useState } from 'react';
import { 
  BarChart3, Calendar, Settings, Users, Tag, 
  LayoutDashboard, ChevronRight, ClipboardList, MessageCircle 
} from 'lucide-react';
import { 
  AnalyticsDashboard, 
  DailySchedule, 
  ServiceManagement, 
  CustomerHistory, 
  PromotionalTools,
  BookingManagement,
  ChatManagement 
} from '../components/dashboard';

type TabId = 'analytics' | 'bookings' | 'schedule' | 'services' | 'customers' | 'promos' | 'chat';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const tabs: Tab[] = [
  { 
    id: 'analytics', 
    label: 'Analytics', 
    icon: <BarChart3 className="h-5 w-5" />,
    description: 'Revenue charts & customer frequency'
  },
  { 
    id: 'bookings', 
    label: 'Bookings', 
    icon: <ClipboardList className="h-5 w-5" />,
    description: 'Accept, reject & complete bookings'
  },
  { 
    id: 'schedule', 
    label: 'Daily Schedule', 
    icon: <Calendar className="h-5 w-5" />,
    description: 'Staff management & appointments'
  },
  { 
    id: 'services', 
    label: 'Services', 
    icon: <Settings className="h-5 w-5" />,
    description: 'Add/Edit prices and durations'
  },
  { 
    id: 'customers', 
    label: 'Customers', 
    icon: <Users className="h-5 w-5" />,
    description: 'Customer history & preferences'
  },
  { 
    id: 'promos', 
    label: 'Promotions', 
    icon: <Tag className="h-5 w-5" />,
    description: 'Create discount codes'
  },
  { 
    id: 'chat', 
    label: 'Messages', 
    icon: <MessageCircle className="h-5 w-5" />,
    description: 'Chat with customers'
  },
];

export const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('analytics');

  // Check if we should auto-open a specific tab (e.g. from notification click)
  React.useEffect(() => {
    const openTab = localStorage.getItem('openDashboardTab');
    if (openTab && tabs.some(t => t.id === openTab)) {
      setActiveTab(openTab as TabId);
      localStorage.removeItem('openDashboardTab');
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'bookings':
        return <BookingManagement />;
      case 'schedule':
        return <DailySchedule />;
      case 'services':
        return <ServiceManagement />;
      case 'customers':
        return <CustomerHistory />;
      case 'promos':
        return <PromotionalTools />;
      case 'chat':
        return <ChatManagement />;
      default:
        return <AnalyticsDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <LayoutDashboard className="h-4 w-4" />
            <span>Salon Dashboard</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900">{tabs.find(t => t.id === activeTab)?.label}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Salon & Beautician Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your salon operations, services, and customers</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">CRM Menu</h2>
              </div>
              <div className="p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition ${
                      activeTab === tab.id
                        ? 'bg-pink-50 text-pink-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      activeTab === tab.id ? 'bg-pink-100' : 'bg-gray-100'
                    }`}>
                      {tab.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${
                        activeTab === tab.id ? 'text-pink-600' : 'text-gray-900'
                      }`}>
                        {tab.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {tab.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};