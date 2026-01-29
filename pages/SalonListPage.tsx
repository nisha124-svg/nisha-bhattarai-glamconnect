import React, { useState, useEffect } from 'react';
import { Salon } from '../types';
import { salons as salonApi } from '../api/client';
import { Search, MapPin, Star, Filter } from 'lucide-react';
import { Button } from '../components/Button';

interface SalonListPageProps {
  onSelectSalon: (salon: Salon) => void;
}

export const SalonListPage: React.FC<SalonListPageProps> = ({ onSelectSalon }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalons = async () => {
      try {
        const response = await salonApi.getAll();
        setSalons(response.data);
      } catch (error) {
        console.error('Error fetching salons:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalons();
  }, []);

  const filteredSalons = salons.filter(salon =>
    salon.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Search Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Salons in "Los Angeles"</h1>
            <p className="text-gray-500">Showing {salons.length} results</p>
          </div>

          <div className="flex space-x-2 w-full md:w-auto">
            <div className="relative flex-grow md:w-80">
              <input
                type="text"
                placeholder="Search salons..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            <button className="p-2 border border-gray-200 rounded-xl bg-white text-gray-600 hover:bg-gray-50 hover:text-pink-600 transition">
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="hidden lg:block space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Filters</h3>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Service Type</h4>
                <div className="space-y-2">
                  {['Hair', 'Nails', 'Spa', 'Makeup'].map(type => (
                    <label key={type} className="flex items-center">
                      <input type="checkbox" className="rounded text-pink-500 focus:ring-pink-500 border-gray-300" />
                      <span className="ml-2 text-gray-600 text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Price Range</h4>
                <div className="space-y-2">
                  {['$', '$$', '$$$'].map(price => (
                    <label key={price} className="flex items-center">
                      <input type="checkbox" className="rounded text-pink-500 focus:ring-pink-500 border-gray-300" />
                      <span className="ml-2 text-gray-600 text-sm">{price}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Rating</h4>
                <div className="space-y-2">
                  {[4, 3, 2].map(rating => (
                    <label key={rating} className="flex items-center">
                      <input type="checkbox" className="rounded text-pink-500 focus:ring-pink-500 border-gray-300" />
                      <span className="ml-2 text-gray-600 text-sm flex items-center">
                        {rating}+ <Star className="h-3 w-3 ml-1 fill-current text-yellow-400" />
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full">Reset Filters</Button>
            </div>
          </div>

          {/* Salon Grid */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-12">Loading salons...</div>
            ) : filteredSalons.map((salon) => (
              <div
                key={salon.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col"
              >
                <div className="relative h-48 bg-gray-200">
                  <img src={salon.image} alt={salon.name} className="w-full h-full object-cover" />
                  <button className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-pink-500 transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                  </button>
                </div>
                <div className="p-5 flex-grow">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg text-gray-900">{salon.name}</h3>
                    <div className="flex items-center bg-green-50 px-2 py-0.5 rounded text-green-700 text-xs font-bold border border-green-100">
                      <Star className="h-3 w-3 fill-current mr-1" />
                      {salon.rating}
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mb-3 flex items-center truncate">
                    <MapPin className="h-3 w-3 mr-1" /> {salon.address}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {salon.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-2 mb-4">
                    {salon.services.slice(0, 2).map(service => (
                      <div key={service.id} className="flex justify-between text-sm text-gray-600 border-b border-gray-50 pb-1 last:border-0">
                        <span>{service.name}</span>
                        <span className="font-medium text-gray-900">${service.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 border-t border-gray-50">
                  <Button className="w-full" onClick={() => onSelectSalon(salon)}>
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};