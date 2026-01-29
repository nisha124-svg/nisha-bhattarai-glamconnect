import React from 'react';
import { Search, MapPin, Star, ChevronRight } from 'lucide-react';
import { Button } from '../components/Button';
import { CATEGORIES, MOCK_SALONS } from '../constants';
import { PageView } from '../types';

interface LandingPageProps {
  onNavigate: (page: PageView) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
            alt="Beauty Salon" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-pink-900/40 to-purple-900/30"></div>
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-md tracking-tight">
            Book Your Beauty Services <br /> 
            <span className="text-pink-200 font-serif italic">Online & Effortless</span>
          </h1>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto font-light">
            Discover and book the best salons, spas, and independent stylists near you. 
            From hair transformations to relaxing massages.
          </p>

          {/* Search Bar */}
          <div className="bg-white p-2 rounded-full shadow-2xl flex flex-col md:flex-row items-center max-w-3xl mx-auto transform transition-all hover:scale-[1.01]">
            <div className="flex-1 flex items-center px-6 py-3 w-full border-b md:border-b-0 md:border-r border-gray-100">
              <MapPin className="h-5 w-5 text-gray-400 mr-3" />
              <input 
                type="text" 
                placeholder="Where are you?" 
                className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
            <div className="flex-1 flex items-center px-6 py-3 w-full">
              <Search className="h-5 w-5 text-gray-400 mr-3" />
              <input 
                type="text" 
                placeholder="Service or Salon name" 
                className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
            <div className="p-1 w-full md:w-auto">
              <Button size="lg" className="w-full md:w-auto shadow-none" onClick={() => onNavigate(PageView.SALON_LIST)}>
                Find Salon
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Browse by Category</h2>
          <p className="text-gray-500">Find exactly what you're looking for</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {CATEGORIES.map((cat, idx) => (
            <div key={idx} className="group cursor-pointer">
              <div className="relative h-40 rounded-2xl overflow-hidden mb-4 shadow-md group-hover:shadow-xl transition-all duration-300">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                  <span className="text-white font-semibold">{cat.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Salons */}
      <section className="py-20 bg-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Recommended for You</h2>
              <p className="text-gray-500">Top rated salons in your area</p>
            </div>
            <button 
              onClick={() => onNavigate(PageView.SALON_LIST)}
              className="text-pink-600 font-medium flex items-center hover:text-pink-700"
            >
              View all <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {MOCK_SALONS.slice(0, 3).map((salon) => (
              <div 
                key={salon.id} 
                onClick={() => onNavigate(PageView.SALON_LIST)}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                <div className="relative h-56">
                  <img src={salon.image} alt={salon.name} className="w-full h-full object-cover" />
                  <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded-lg shadow-sm flex items-center text-sm font-bold text-gray-800">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    {salon.rating}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{salon.name}</h3>
                  </div>
                  <p className="text-gray-500 text-sm mb-4 flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-gray-400" /> {salon.address}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {salon.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-pink-50 text-pink-600 text-xs rounded-full font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full" onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(PageView.SALON_LIST); 
                  }}>
                    Book Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-gradient-to-r from-pink-500 to-rose-400 rounded-3xl p-12 md:p-20 text-center text-white shadow-2xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Are you a Salon Owner?</h2>
            <p className="text-xl md:text-2xl text-pink-100 mb-10 max-w-2xl mx-auto">
              Join GlamConnect to manage your appointments, grow your clientele, and streamline your business.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-white text-pink-600 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition shadow-lg">
                Partner with Us
              </button>
              <button className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white/10 transition">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};