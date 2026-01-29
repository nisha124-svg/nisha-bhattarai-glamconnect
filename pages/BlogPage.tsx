import React from 'react';
import { Calendar, User, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '../components/Button';

export const BlogPage: React.FC = () => {
  const POSTS = [
    {
      id: 1,
      title: "5 Summer Hair Trends You Need to Try",
      excerpt: "From beach waves to curtain bangs, discover the hottest hairstyles that are taking over this season.",
      image: "https://images.unsplash.com/photo-1560869713-7d0a29430803?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      author: "Sarah Jenkins",
      date: "June 12, 2024",
      category: "Hair"
    },
    {
      id: 2,
      title: "The Ultimate Skincare Routine for Glowing Skin",
      excerpt: "Achieve that glass skin look with our step-by-step guide to layering serums, moisturizers, and oils.",
      image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      author: "Dr. Emily Chen",
      date: "May 28, 2024",
      category: "Skincare"
    },
    {
      id: 3,
      title: "Bridal Makeup: Do's and Don'ts",
      excerpt: "Planning your big day? Here are the essential tips to ensure your makeup lasts through tears and dancing.",
      image: "https://images.unsplash.com/photo-1487412947132-23c53f720d1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      author: "Jessica Lee",
      date: "May 15, 2024",
      category: "Makeup"
    },
    {
      id: 4,
      title: "Benefits of Regular Facials",
      excerpt: "Why treating yourself to a monthly facial is more than just a luxury—it's an investment in your skin's future.",
      image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      author: "Amanda White",
      date: "April 30, 2024",
      category: "Wellness"
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-pink-50 py-16 text-center border-b border-pink-100">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 font-serif">The Beauty Edit</h1>
        <p className="text-gray-600 max-w-2xl mx-auto px-4">
          Expert advice, trend reports, and inspiration for your beauty journey.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {['All Posts', 'Hair', 'Makeup', 'Skincare', 'Wellness', 'Nails'].map((cat, i) => (
            <button 
              key={cat}
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                i === 0 
                  ? 'bg-pink-500 text-white shadow-md' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-pink-300 hover:text-pink-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Post */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="h-64 md:h-96 w-full">
              <img 
                src="https://images.unsplash.com/photo-1522337660859-02fbefca4702?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                alt="Featured" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-8 md:p-12">
              <span className="text-pink-600 font-bold text-sm tracking-wider uppercase mb-2 block">Trending Now</span>
              <h2 className="text-3xl font-bold text-gray-900 mb-4 hover:text-pink-600 cursor-pointer transition">
                The Minimalist Makeup Look: Less is More
              </h2>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Gone are the days of heavy contouring. This season is all about fresh skin, fluffy brows, and a touch of cream blush. Learn how to master the "clean girl" aesthetic in 5 simple steps.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <User className="h-4 w-4 mr-1" />
                  <span className="mr-4">Glam Team</span>
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>June 20, 2024</span>
                </div>
                <Button variant="outline">Read Article</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Post Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
          {POSTS.map((post) => (
            <div key={post.id} className="flex flex-col group cursor-pointer">
              <div className="rounded-2xl overflow-hidden mb-4 h-64 relative">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm">
                  {post.category}
                </div>
              </div>
              <div className="flex items-center text-xs text-gray-400 mb-2 space-x-2">
                <span>{post.date}</span>
                <span>•</span>
                <span>{post.author}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-pink-600 transition">
                {post.title}
              </h3>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                {post.excerpt}
              </p>
              <div className="mt-auto">
                <button className="text-pink-600 font-medium text-sm flex items-center hover:text-pink-700">
                  Read More <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button variant="secondary" size="lg">Load More Articles</Button>
        </div>
      </div>
    </div>
  );
};