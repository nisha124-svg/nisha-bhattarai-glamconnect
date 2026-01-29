import React from 'react';
import { Tag, Clock, ArrowRight, Percent } from 'lucide-react';
import { Button } from '../components/Button';
import { Salon } from '../types';
import { MOCK_SALONS } from '../constants';

interface OffersPageProps {
  onSelectSalon: (salon: Salon) => void;
}

export const OffersPage: React.FC<OffersPageProps> = ({ onSelectSalon }) => {
  const OFFERS = [
    {
      id: 1,
      title: "Summer Glow Package",
      discount: "20% OFF",
      salonId: '1',
      description: "Get ready for the sun with our exclusive facial and hydration package. Limited time only!",
      expires: "2 days left",
      code: "SUMMER20",
      image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 2,
      title: "Bridal Trial Special",
      discount: "$50 OFF",
      salonId: '2',
      description: "Planning your big day? Book a trial session this week and save on your full booking.",
      expires: "1 week left",
      code: "BRIDE50",
      image: "https://images.unsplash.com/photo-1487412947132-23c53f720d1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 3,
      title: "Manicure Monday",
      discount: "BOGO 50%",
      salonId: '3',
      description: "Bring a friend! Buy one Gel Manicure and get the second one for 50% off every Monday.",
      expires: "Every Monday",
      code: "NAILBFF",
      image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 4,
      title: "New Client Welcome",
      discount: "15% OFF",
      salonId: '1',
      description: "First time at Luxe & Glow? Enjoy a special welcome discount on any hair service.",
      expires: "Ongoing",
      code: "WELCOME15",
      image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    }
  ];

  const handleGetOffer = (salonId: string) => {
    const salon = MOCK_SALONS.find(s => s.id === salonId);
    if (salon) {
      onSelectSalon(salon);
    }
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {OFFERS.map((offer) => (
            <div key={offer.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 group">
              <div className="flex flex-col md:flex-row h-full">
                <div className="md:w-2/5 relative h-48 md:h-auto">
                  <img src={offer.image} alt={offer.title} className="w-full h-full object-cover" />
                  <div className="absolute top-0 left-0 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-br-lg">
                    FEATURED
                  </div>
                </div>
                <div className="p-6 md:w-3/5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <Clock className="w-3 h-3 mr-1" /> {offer.expires}
                      </span>
                      <div className="bg-pink-50 p-2 rounded-lg">
                         <Tag className="h-5 w-5 text-pink-500" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{offer.title}</h3>
                    <div className="text-2xl font-bold text-pink-600 mb-3">{offer.discount}</div>
                    <p className="text-gray-500 text-sm mb-4">{offer.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                    <div className="bg-gray-100 px-3 py-1 rounded border border-gray-200 border-dashed text-gray-600 font-mono text-sm">
                      {offer.code}
                    </div>
                    <Button size="sm" onClick={() => handleGetOffer(offer.salonId)} className="group-hover:bg-pink-600">
                      Book Now <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

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