import React, { useState, useEffect } from 'react';
import { Salon, Service } from '../types';
import { salons as salonApi } from '../api/client';
import { Search, MapPin, Star, Filter, X, SlidersHorizontal, Clock, DollarSign, Map as MapIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { SalonMap, LocationButton } from '../components/GoogleMap';

interface SalonListPageProps {
  onSelectSalon: (salon: Salon) => void;
}

interface FilterState {
  serviceTypes: string[];
  priceRange: string[];
  rating: number | null;
  sortBy: 'rating' | 'price' | 'name' | 'distance';
}

export const SalonListPage: React.FC<SalonListPageProps> = ({ onSelectSalon }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    serviceTypes: [],
    priceRange: [],
    rating: null,
    sortBy: 'rating'
  });

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

  // Handle search with API
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      try {
        setLoading(true);
        const response = await salonApi.search(query);
        setSalons(response.data);
      } catch (error) {
        console.error('Error searching salons:', error);
      } finally {
        setLoading(false);
      }
    } else if (query.length === 0) {
      try {
        setLoading(true);
        const response = await salonApi.getAll();
        setSalons(response.data);
      } catch (error) {
        console.error('Error fetching salons:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter toggle functions
  const toggleServiceType = (type: string) => {
    setFilters(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(type)
        ? prev.serviceTypes.filter(t => t !== type)
        : [...prev.serviceTypes, type]
    }));
  };

  const togglePriceRange = (range: string) => {
    setFilters(prev => ({
      ...prev,
      priceRange: prev.priceRange.includes(range)
        ? prev.priceRange.filter(r => r !== range)
        : [...prev.priceRange, range]
    }));
  };

  const setRatingFilter = (rating: number | null) => {
    setFilters(prev => ({ ...prev, rating }));
  };

  const resetFilters = () => {
    setFilters({
      serviceTypes: [],
      priceRange: [],
      rating: null,
      sortBy: 'rating'
    });
  };

  // Calculate average price for a salon
  const getAvgPrice = (salon: Salon): number => {
    if (!salon.services || salon.services.length === 0) return 0;
    return salon.services.reduce((sum, s) => sum + s.price, 0) / salon.services.length;
  };

  // Get price tier for a salon
  const getPriceTier = (salon: Salon): string => {
    const avgPrice = getAvgPrice(salon);
    if (avgPrice < 30) return '$';
    if (avgPrice < 60) return '$$';
    return '$$$';
  };

  // Apply all filters
  const filteredSalons = salons
    .filter(salon => {
      // Service type filter
      if (filters.serviceTypes.length > 0) {
        const hasMatchingService = salon.services?.some(service =>
          filters.serviceTypes.some(type => 
            service.category?.toLowerCase() === type.toLowerCase() ||
            service.name.toLowerCase().includes(type.toLowerCase())
          )
        );
        if (!hasMatchingService) return false;
      }

      // Price range filter
      if (filters.priceRange.length > 0) {
        const priceTier = getPriceTier(salon);
        if (!filters.priceRange.includes(priceTier)) return false;
      }

      // Rating filter
      if (filters.rating && salon.rating < filters.rating) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'price':
          return getAvgPrice(a) - getAvgPrice(b);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const activeFilterCount = 
    filters.serviceTypes.length + 
    filters.priceRange.length + 
    (filters.rating ? 1 : 0);

  const FilterSidebar = ({ isMobile = false }) => (
    <div className={`${isMobile ? '' : 'bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900">Filters</h3>
        {activeFilterCount > 0 && (
          <span className="bg-pink-100 text-pink-600 text-xs px-2 py-1 rounded-full">
            {activeFilterCount} active
          </span>
        )}
      </div>

      {/* Service Type Filter */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Service Type</h4>
        <div className="space-y-2">
          {['Hair', 'Nails', 'Spa', 'Makeup', 'Bridal'].map(type => (
            <label key={type} className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded text-pink-500 focus:ring-pink-500 border-gray-300"
                checked={filters.serviceTypes.includes(type)}
                onChange={() => toggleServiceType(type)}
              />
              <span className="ml-2 text-gray-600 text-sm">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Price Range</h4>
        <div className="space-y-2">
          {[
            { label: '$ (Budget)', value: '$' },
            { label: '$$ (Mid-range)', value: '$$' },
            { label: '$$$ (Premium)', value: '$$$' }
          ].map(price => (
            <label key={price.value} className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded text-pink-500 focus:ring-pink-500 border-gray-300"
                checked={filters.priceRange.includes(price.value)}
                onChange={() => togglePriceRange(price.value)}
              />
              <span className="ml-2 text-gray-600 text-sm">{price.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating Filter */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Minimum Rating</h4>
        <div className="space-y-2">
          {[4.5, 4, 3.5, 3].map(rating => (
            <label key={rating} className="flex items-center cursor-pointer">
              <input 
                type="radio" 
                name="rating"
                className="text-pink-500 focus:ring-pink-500 border-gray-300"
                checked={filters.rating === rating}
                onChange={() => setRatingFilter(rating)}
              />
              <span className="ml-2 text-gray-600 text-sm flex items-center">
                {rating}+ <Star className="h-3 w-3 ml-1 fill-current text-yellow-400" />
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Sort By */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Sort By</h4>
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500"
        >
          <option value="rating">Highest Rated</option>
          <option value="price">Lowest Price</option>
          <option value="name">Name (A-Z)</option>
          <option value="distance">Nearest First</option>
        </select>
      </div>

      {/* Location for distance sorting */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Your Location</h4>
        <LocationButton 
          onLocationFound={(lat, lng) => setUserLocation({ lat, lng })}
        />
      </div>

      <Button variant="outline" size="sm" className="w-full" onClick={resetFilters}>
        Reset Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Search Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Discover Salons</h1>
            <p className="text-gray-500">
              Showing {filteredSalons.length} of {salons.length} results
              {activeFilterCount > 0 && ` (${activeFilterCount} filters applied)`}
            </p>
          </div>

          <div className="flex space-x-2 w-full md:w-auto">
            <div className="relative flex-grow md:w-80">
              <input
                type="text"
                placeholder="Search by name, service, location..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              {searchQuery && (
                <button 
                  onClick={() => handleSearch('')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowMap(!showMap)}
              className={`p-2.5 border rounded-xl transition ${showMap ? 'bg-pink-500 text-white border-pink-500' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
              title={showMap ? 'Hide Map' : 'Show Map'}
            >
              <MapIcon className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden p-2.5 border border-gray-200 rounded-xl bg-white text-gray-600 hover:bg-gray-50 hover:text-pink-600 transition relative"
            >
              <SlidersHorizontal className="h-5 w-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Filter Modal */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
            <div className="absolute right-0 top-0 h-full w-80 bg-white p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Filters</h2>
                <button onClick={() => setShowMobileFilters(false)}>
                  <X className="h-6 w-6" />
                </button>
              </div>
              <FilterSidebar isMobile />
              <Button className="w-full mt-4" onClick={() => setShowMobileFilters(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        )}

        {/* Map View */}
        {showMap && (
          <div className="mb-8">
            <SalonMap 
              salons={filteredSalons} 
              userLocation={userLocation} 
              onSalonClick={onSelectSalon}
              height="350px"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar - Desktop */}
          <div className="hidden lg:block space-y-8">
            <FilterSidebar />
          </div>

          {/* Salon Grid */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-pink-500 border-t-transparent mb-4"></div>
                <p className="text-gray-500">Loading salons...</p>
              </div>
            ) : filteredSalons.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No salons found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your filters or search query</p>
                <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
              </div>
            ) : filteredSalons.map((salon) => (
              <div
                key={salon.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group"
              >
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  <img 
                    src={salon.image} 
                    alt={salon.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-sm font-medium text-gray-700">
                    {getPriceTier(salon)}
                  </div>
                  <button className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-pink-500 transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                  </button>
                </div>
                <div className="p-5 flex-grow">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg text-gray-900">{salon.name}</h3>
                    <div className="flex items-center bg-green-50 px-2 py-0.5 rounded text-green-700 text-xs font-bold border border-green-100">
                      <Star className="h-3 w-3 fill-current mr-1" />
                      {salon.rating.toFixed(1)}
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mb-3 flex items-center truncate">
                    <MapPin className="h-3 w-3 mr-1 flex-shrink-0" /> {salon.address}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {salon.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                        {tag}
                      </span>
                    ))}
                    {salon.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                        +{salon.tags.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {salon.services.slice(0, 2).map(service => (
                      <div key={service.id} className="flex justify-between text-sm text-gray-600 border-b border-gray-50 pb-1 last:border-0">
                        <span className="flex items-center">
                          {service.name}
                          <span className="text-xs text-gray-400 ml-2 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />{service.duration}min
                          </span>
                        </span>
                        <span className="font-medium text-gray-900">${service.price}</span>
                      </div>
                    ))}
                    {salon.services.length > 2 && (
                      <p className="text-xs text-pink-500">+{salon.services.length - 2} more services</p>
                    )}
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