import React, { useState, useEffect } from 'react';
import { Salon, Service } from '../types';
import { salons as salonApi } from '../api/client';
import { DollarSign, Star, MapPin, ArrowUpDown, Loader2, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../components/Button';
import { CATEGORIES } from '../constants';

interface PriceComparisonPageProps {
  onSelectSalon: (salon: Salon) => void;
}

interface ServiceComparison {
  category: string;
  serviceName: string;
  offerings: {
    salon: Salon;
    service: Service;
  }[];
}

export const PriceComparisonPage: React.FC<PriceComparisonPageProps> = ({ onSelectSalon }) => {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedService, setExpandedService] = useState<string | null>(null);

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

  // Build comparison data: group services by name across salons
  const buildComparisons = (): ServiceComparison[] => {
    const serviceMap = new Map<string, ServiceComparison>();

    salons.forEach(salon => {
      salon.services?.forEach(service => {
        const key = service.name.toLowerCase().trim();
        
        if (!serviceMap.has(key)) {
          serviceMap.set(key, {
            category: service.category,
            serviceName: service.name,
            offerings: []
          });
        }

        serviceMap.get(key)!.offerings.push({ salon, service });
      });
    });

    let comparisons = Array.from(serviceMap.values());

    // Filter by category
    if (selectedCategory !== 'All') {
      comparisons = comparisons.filter(c => 
        c.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery) {
      comparisons = comparisons.filter(c =>
        c.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort offerings within each comparison
    comparisons.forEach(c => {
      c.offerings.sort((a, b) => {
        return sortOrder === 'asc' 
          ? a.service.price - b.service.price 
          : b.service.price - a.service.price;
      });
    });

    // Sort comparisons by number of offerings (most compared first)
    comparisons.sort((a, b) => b.offerings.length - a.offerings.length);

    return comparisons;
  };

  const comparisons = buildComparisons();

  // Summary stats
  const allServices = salons.flatMap(s => s.services || []);
  const categories = ['All', ...CATEGORIES.map(c => c.name)];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading price data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-pink-500" />
            Price Comparison
          </h1>
          <p className="text-gray-500">
            Compare service prices across different salons to find the best deals
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Total Salons</p>
            <p className="text-2xl font-bold text-gray-900">{salons.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Total Services</p>
            <p className="text-2xl font-bold text-gray-900">{allServices.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Avg Price</p>
            <p className="text-2xl font-bold text-pink-600">
              NPR {allServices.length > 0 
                ? Math.round(allServices.reduce((s, svc) => s + svc.price, 0) / allServices.length)
                : 0}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Price Range</p>
            <p className="text-2xl font-bold text-gray-900">
              {allServices.length > 0 
                ? `NPR ${Math.min(...allServices.map(s => s.price))} - ${Math.max(...allServices.map(s => s.price))}`
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* Search */}
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search service name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    selectedCategory === cat 
                      ? 'bg-pink-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort */}
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition whitespace-nowrap"
            >
              <ArrowUpDown className="h-4 w-4" />
              Price: {sortOrder === 'asc' ? 'Low → High' : 'High → Low'}
            </button>
          </div>
        </div>

        {/* Comparison Cards */}
        {comparisons.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No services found</h3>
            <p className="text-gray-500">Try a different category or search term</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comparisons.map((comparison) => {
              const isExpanded = expandedService === comparison.serviceName;
              const cheapest = comparison.offerings[0]?.service.price;
              const expensive = comparison.offerings[comparison.offerings.length - 1]?.service.price;
              const savings = expensive - cheapest;

              return (
                <div 
                  key={comparison.serviceName}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  {/* Service Header */}
                  <button
                    onClick={() => setExpandedService(isExpanded ? null : comparison.serviceName)}
                    className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-pink-50 p-2.5 rounded-xl">
                        <DollarSign className="h-5 w-5 text-pink-500" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-gray-900">{comparison.serviceName}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{comparison.category}</span>
                          <span>{comparison.offerings.length} salon{comparison.offerings.length !== 1 ? 's' : ''}</span>
                          {savings > 0 && (
                            <span className="text-green-600 font-medium">
                              Save up to NPR {savings}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-pink-600">
                          NPR {cheapest}
                          {comparison.offerings.length > 1 && (
                            <span className="text-gray-400 text-sm font-normal"> - NPR {expensive}</span>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Comparison Table */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-5 pb-5">
                      <div className="overflow-x-auto">
                        <table className="w-full mt-4">
                          <thead>
                            <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                              <th className="pb-3 font-medium">Salon</th>
                              <th className="pb-3 font-medium">Rating</th>
                              <th className="pb-3 font-medium">Duration</th>
                              <th className="pb-3 font-medium">Price</th>
                              <th className="pb-3 font-medium text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {comparison.offerings.map((offering, idx) => (
                              <tr 
                                key={`${offering.salon.id}-${offering.service.id}`}
                                className={`border-b border-gray-50 last:border-0 ${idx === 0 ? 'bg-green-50/50' : ''}`}
                              >
                                <td className="py-3">
                                  <div className="flex items-center gap-3">
                                    <img 
                                      src={offering.salon.image} 
                                      alt={offering.salon.name}
                                      className="h-10 w-10 rounded-lg object-cover"
                                    />
                                    <div>
                                      <p className="font-medium text-gray-900">{offering.salon.name}</p>
                                      <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />{offering.salon.address}
                                      </p>
                                    </div>
                                    {idx === 0 && comparison.offerings.length > 1 && (
                                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                        Best Price
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3">
                                  <div className="flex items-center gap-1 text-sm">
                                    <Star className="h-3 w-3 fill-current text-yellow-400" />
                                    <span className="font-medium">{offering.salon.rating?.toFixed(1)}</span>
                                  </div>
                                </td>
                                <td className="py-3 text-sm text-gray-600">
                                  {offering.service.duration} min
                                </td>
                                <td className="py-3">
                                  <span className={`font-bold text-lg ${idx === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                    NPR {offering.service.price}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <Button 
                                    size="sm" 
                                    onClick={() => onSelectSalon(offering.salon)}
                                  >
                                    View Salon
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
