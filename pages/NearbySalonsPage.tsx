import React, { useState, useEffect } from 'react';
import { Salon } from '../types';
import { salons as salonApi } from '../api/client';
import { SalonMap, useGeolocation, LocationButton } from '../components/GoogleMap';
import { MapPin, Star, Navigation, Loader2, Clock, AlertCircle, ArrowUpDown } from 'lucide-react';
import { Button } from '../components/Button';

interface NearbySalonsPageProps {
  onSelectSalon: (salon: Salon) => void;
}

interface NearbySalonItem extends Salon {
  distance?: number;
  latitude?: number;
  longitude?: number;
}

export const NearbySalonsPage: React.FC<NearbySalonsPageProps> = ({ onSelectSalon }) => {
  const [nearbySalons, setNearbySalons] = useState<NearbySalonItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(10); // km
  const [sortBy, setSortBy] = useState<'distance' | 'rating'>('distance');
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch nearby salons when location is available
  const fetchNearbySalons = async (lat: number, lng: number, searchRadius: number) => {
    setLoading(true);
    try {
      const response = await salonApi.getNearby(lat, lng, searchRadius, 50);
      const data = response.data;
      setNearbySalons(data.salons || []);
      setHasSearched(true);
    } catch (error) {
      console.error('Error fetching nearby salons:', error);
      // Fallback: fetch all salons if nearby endpoint fails
      try {
        const response = await salonApi.getAll();
        setNearbySalons(response.data);
        setHasSearched(true);
      } catch (fallbackError) {
        console.error('Error fetching salons:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLocationFound = (lat: number, lng: number) => {
    setUserLocation({ lat, lng });
    fetchNearbySalons(lat, lng, radius);
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    if (userLocation) {
      fetchNearbySalons(userLocation.lat, userLocation.lng, newRadius);
    }
  };

  const sortedSalons = [...nearbySalons].sort((a, b) => {
    if (sortBy === 'distance') {
      return (a.distance || 999) - (b.distance || 999);
    }
    return b.rating - a.rating;
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <MapPin className="h-8 w-8 text-pink-500" />
            Nearby Salons
          </h1>
          <p className="text-gray-500">
            Find the best salons close to your location
          </p>
        </div>

        {/* Location & Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <LocationButton 
              onLocationFound={handleLocationFound}
            />

            {userLocation && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Radius:</span>
                  <select
                    value={radius}
                    onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-pink-500"
                  >
                    <option value={2}>2 km</option>
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                    <option value={25}>25 km</option>
                    <option value={50}>50 km</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-pink-500"
                  >
                    <option value="distance">Nearest First</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>

                <div className="text-sm text-gray-400 ml-auto">
                  📍 {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Map View */}
        {userLocation && (
          <div className="mb-8">
            <SalonMap
              salons={sortedSalons}
              userLocation={userLocation}
              onSalonClick={onSelectSalon}
              height="350px"
            />
          </div>
        )}

        {/* Results */}
        {!hasSearched && !loading ? (
          <div className="text-center py-16">
            <Navigation className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Enable Location</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Click "Use my location" above to discover salons near you. 
              We'll find the best options within your selected radius.
            </p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-pink-500 mb-4" />
            <p className="text-gray-500">Finding nearby salons...</p>
          </div>
        ) : sortedSalons.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No salons found nearby</h3>
            <p className="text-gray-500 mb-4">Try increasing the search radius</p>
            <Button variant="outline" onClick={() => handleRadiusChange(50)}>
              Search within 50 km
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-900">
                {sortedSalons.length} salon{sortedSalons.length !== 1 ? 's' : ''} found
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedSalons.map((salon) => (
                <div
                  key={salon.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group cursor-pointer"
                  onClick={() => onSelectSalon(salon)}
                >
                  <div className="relative h-44 bg-gray-200 overflow-hidden">
                    <img 
                      src={salon.image} 
                      alt={salon.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    {salon.distance !== undefined && (
                      <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-md flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {salon.distance} km
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-sm font-bold text-gray-700 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current text-yellow-400" />
                      {salon.rating?.toFixed(1)}
                    </div>
                  </div>

                  <div className="p-5 flex-grow">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{salon.name}</h3>
                    <p className="text-gray-500 text-sm mb-3 flex items-center">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" /> {salon.address}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {salon.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-1 bg-pink-50 text-pink-600 text-xs rounded-md font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {salon.services?.length > 0 && (
                      <div className="text-sm text-gray-500">
                        <span className="font-medium text-gray-700">
                          Starting from NPR {Math.min(...salon.services.map(s => s.price))}
                        </span>
                        <span className="ml-1">• {salon.services.length} services</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-gray-50">
                    <Button className="w-full" onClick={(e) => {
                      e.stopPropagation();
                      onSelectSalon(salon);
                    }}>
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
