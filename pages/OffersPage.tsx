import React, { useState, useEffect } from 'react';
import { Tag, Clock, ArrowRight, Percent, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Salon } from '../types';
import { salons as salonApi, promos } from '../api/client';

interface OffersPageProps {
  onSelectSalon: (salon: Salon) => void;
}

interface PromoOffer {
  id: string;
  code: string;
  description: string | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minPurchase: number | null;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  salon?: {
    id: string;
    name: string;
    image: string;
  };
}

const OFFER_IMAGES = [
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1487412947132-23c53f720d1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1604654894610-df63bc536371?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
];

export const OffersPage: React.FC<OffersPageProps> = ({ onSelectSalon }) => {
  const [offers, setOffers] = useState<PromoOffer[]>([]);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [promosRes, salonsRes] = await Promise.all([
          promos.getAll(),
          salonApi.getAll()
        ]);
        setOffers(promosRes.data.filter((p: PromoOffer) => p.isActive));
        setSalons(salonsRes.data);
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleGetOffer = (offer: PromoOffer) => {
    // Get a random salon for now, in a real app this would be linked
    const randomSalon = salons[Math.floor(Math.random() * salons.length)];
    if (randomSalon) {
      onSelectSalon(randomSalon);
    }
  };

  const getExpiryText = (validUntil: string | null) => {
    if (!validUntil) return 'Ongoing';
    const expiry = new Date(validUntil);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return '1 day left';
    if (diffDays <= 7) return `${diffDays} days left`;
    return `${Math.ceil(diffDays / 7)} weeks left`;
  };

  const getDiscountText = (offer: PromoOffer) => {
    if (offer.discountType === 'PERCENTAGE') {
      return `${offer.discountValue}% OFF`;
    }
    return `NPR ${offer.discountValue} OFF`;
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Hero Section */}
      <div className="bg-pink-600 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-rose-500"></div>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px'}}></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Exclusive Beauty Deals</h1>
          <p className="text-xl text-pink-100 max-w-2xl mx-auto">
            Pamper yourself for less. Discover limited-time offers and packages from top-rated salons near you.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
          </div>
        ) : offers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Offers</h3>
            <p className="text-gray-500">Check back soon for exciting deals and discounts!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {offers.map((offer, index) => (
              <div key={offer.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                <div className="flex flex-col md:flex-row h-full">
                  <div className="md:w-2/5 relative h-48 md:h-auto">
                    <img 
                      src={OFFER_IMAGES[index % OFFER_IMAGES.length]} 
                      alt={offer.code} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute top-0 left-0 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-br-lg">
                      FEATURED
                    </div>
                  </div>
                  <div className="p-6 md:w-3/5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <Clock className="w-3 h-3 mr-1" /> {getExpiryText(offer.validUntil)}
                        </span>
                        <div className="bg-pink-50 p-2 rounded-lg">
                           <Tag className="h-5 w-5 text-pink-500" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {offer.description || `Special ${offer.code} Offer`}
                      </h3>
                      <div className="text-2xl font-bold text-pink-600 mb-3">{getDiscountText(offer)}</div>
                      <p className="text-gray-500 text-sm mb-4">
                        {offer.minPurchase 
                          ? `Minimum purchase of NPR ${offer.minPurchase.toLocaleString()} required.`
                          : 'No minimum purchase required. Valid on all services.'
                        }
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                      <div className="bg-gray-100 px-3 py-1 rounded border border-gray-200 border-dashed text-gray-600 font-mono text-sm">
                        {offer.code}
                      </div>
                      <Button size="sm" onClick={() => handleGetOffer(offer)} className="group-hover:bg-pink-600">
                        Book Now <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Newsletter Signup */}
        <div className="mt-16 bg-white rounded-3xl p-8 md:p-12 shadow-sm text-center relative overflow-hidden border border-pink-100">
           <div className="absolute top-0 right-0 -mt-10 -mr-10 h-32 w-32 bg-pink-100 rounded-full blur-3xl opacity-60"></div>
           <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-32 w-32 bg-purple-100 rounded-full blur-3xl opacity-60"></div>
           
           <div className="relative z-10">
             <div className="inline-block p-3 bg-pink-50 rounded-full text-pink-500 mb-4">
               <Percent className="h-6 w-6" />
             </div>
             <h2 className="text-2xl font-bold text-gray-900 mb-3">Never Miss a Deal</h2>
             <p className="text-gray-500 mb-8 max-w-md mx-auto">
               Subscribe to our newsletter and get notified about flash sales, new salon openings, and exclusive beauty tips.
             </p>
             <div className="flex flex-col sm:flex-row justify-center max-w-md mx-auto gap-3">
               <input 
                 type="email" 
                 placeholder="Enter your email" 
                 className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
               />
               <Button>Subscribe</Button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};