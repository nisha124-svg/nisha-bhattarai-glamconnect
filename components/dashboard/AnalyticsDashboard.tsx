import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { DollarSign, Users, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { dashboard } from '../../api/client';

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    weeklyRevenue: number;
    totalAppointments: number;
    weeklyAppointments: number;
    uniqueCustomers: number;
    newCustomers: number;
    avgOrderValue: number;
  };
  chartData: { name: string; revenue: number; bookings: number }[];
  popularServices: { name: string; count: number }[];
  customerFrequency: {
    oneTime: number;
    returning: number;
    loyal: number;
  };
}

const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await dashboard.getAnalytics();
      setData(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        {error}
        <button 
          onClick={fetchAnalytics}
          className="ml-4 text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const pieData = [
    { name: 'One-time', value: data.customerFrequency.oneTime },
    { name: 'Returning', value: data.customerFrequency.returning },
    { name: 'Loyal', value: data.customerFrequency.loyal },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={<DollarSign className="h-6 w-6" />}
          iconBg="bg-pink-50 text-pink-600"
          label="Total Revenue (30d)"
          value={`$${data.summary.totalRevenue.toLocaleString()}`}
          change="+12.5%"
          positive
        />
        <StatCard
          icon={<Calendar className="h-6 w-6" />}
          iconBg="bg-purple-50 text-purple-600"
          label="Appointments (30d)"
          value={data.summary.totalAppointments.toString()}
          change={`${data.summary.weeklyAppointments} this week`}
        />
        <StatCard
          icon={<Users className="h-6 w-6" />}
          iconBg="bg-blue-50 text-blue-600"
          label="New Customers"
          value={data.summary.newCustomers.toString()}
          change={`${data.summary.uniqueCustomers} total`}
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6" />}
          iconBg="bg-green-50 text-green-600"
          label="Avg. Order Value"
          value={`$${data.summary.avgOrderValue.toFixed(2)}`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-gray-900 mb-6">Revenue Overview (Last 7 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: number) => [`$${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bookings Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-gray-900 mb-6">Weekly Bookings</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                />
                <Bar dataKey="bookings" fill="#c084fc" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Services */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-gray-900 mb-6">Popular Services</h3>
          <div className="space-y-4">
            {data.popularServices.map((service, index) => (
              <div key={service.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-gray-700">{service.name}</span>
                </div>
                <span className="text-gray-500 font-medium">{service.count} bookings</span>
              </div>
            ))}
            {data.popularServices.length === 0 && (
              <p className="text-gray-400 text-center py-4">No data available</p>
            )}
          </div>
        </div>

        {/* Customer Frequency */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-gray-900 mb-6">Customer Loyalty</h3>
          <div className="flex items-center justify-center h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-gray-600">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, iconBg, label, value, change, positive }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
    <div className="flex justify-between items-center mb-4">
      <div className={`p-3 rounded-full ${iconBg}`}>
        {icon}
      </div>
      {change && (
        <span className={`text-sm font-medium ${positive ? 'text-green-500' : 'text-gray-400'}`}>
          {change}
        </span>
      )}
    </div>
    <p className="text-gray-500 text-sm">{label}</p>
    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
  </div>
);
