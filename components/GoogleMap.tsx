import React, { useEffect, useRef, useState } from 'react';
import { Salon } from '../types';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

interface GoogleMapProps {
  salons: (Salon & { distance?: number })[];
  userLocation: { lat: number; lng: number } | null;
  onSalonClick?: (salon: Salon) => void;
  height?: string;
}

/**
 * Interactive map component showing salon locations.
 * Uses Leaflet (OpenStreetMap) - no API key required.
 */
export const SalonMap: React.FC<GoogleMapProps> = ({ 
  salons, 
  userLocation, 
  onSalonClick, 
  height = '400px' 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    if (!(window as any).L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Clear previous map
    if (mapInstance) {
      mapInstance.remove();
    }

    // Default to Kathmandu if no user location
    const center = userLocation || { lat: 27.7172, lng: 85.3240 };
    const map = L.map(mapRef.current).setView([center.lat, center.lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // User location marker
    if (userLocation) {
      const userIcon = L.divIcon({
        html: `<div style="background: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
        className: '',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>Your Location</b>');
    }

    // Salon markers
    const salonIcon = L.divIcon({
      html: `<div style="background: #ec4899; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">💇</div>`,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const bounds: [number, number][] = [];

    salons.forEach(salon => {
      const lat = (salon as any).latitude;
      const lng = (salon as any).longitude;
      if (lat && lng) {
        bounds.push([lat, lng]);
        const marker = L.marker([lat, lng], { icon: salonIcon }).addTo(map);
        marker.bindPopup(`
          <div style="min-width: 150px;">
            <strong style="font-size: 14px;">${salon.name}</strong><br/>
            <span style="color: #666; font-size: 12px;">${salon.address}</span><br/>
            <span style="color: #ec4899; font-weight: bold;">⭐ ${salon.rating}</span>
            ${(salon as any).distance ? `<br/><span style="color: #3b82f6; font-size: 12px;">📍 ${(salon as any).distance} km away</span>` : ''}
          </div>
        `);
        marker.on('click', () => {
          if (onSalonClick) onSalonClick(salon);
        });
      }
    });

    if (userLocation) {
      bounds.push([userLocation.lat, userLocation.lng]);
    }

    // Fit map to show all markers
    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    setMapInstance(map);

    return () => {
      // Cleanup will happen on next render
    };
  }, [mapLoaded, salons, userLocation]);

  if (!mapLoaded) {
    return (
      <div 
        style={{ height }} 
        className="bg-gray-100 rounded-2xl flex items-center justify-center"
      >
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      style={{ height }} 
      className="rounded-2xl overflow-hidden shadow-md border border-gray-200 z-0"
    />
  );
};

/**
 * Hook to get user's current geolocation
 */
export const useGeolocation = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  };

  return { location, error, loading, requestLocation };
};

/**
 * Location button component
 */
export const LocationButton: React.FC<{
  onLocationFound: (lat: number, lng: number) => void;
  className?: string;
}> = ({ onLocationFound, className = '' }) => {
  const { location, error, loading, requestLocation } = useGeolocation();

  useEffect(() => {
    if (location) {
      onLocationFound(location.lat, location.lng);
    }
  }, [location]);

  return (
    <div className={className}>
      <button
        onClick={requestLocation}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition font-medium text-sm border border-blue-200"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Detecting location...
          </>
        ) : (
          <>
            <Navigation className="h-4 w-4" />
            {location ? 'Location detected ✓' : 'Use my location'}
          </>
        )}
      </button>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};
