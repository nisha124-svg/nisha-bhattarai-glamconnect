import React, { useState } from 'react';
import { Button } from '../components/Button';
import { salons } from '../api/client';
import {
  Store, MapPin, FileText, Scissors, UserPlus, ChevronRight, ChevronLeft,
  Plus, Trash2, CheckCircle, Clock, DollarSign, Tag, Image, Sparkles, Loader2
} from 'lucide-react';

interface ServiceInput {
  id: string;
  name: string;
  duration: string;
  price: string;
  category: string;
}

interface StylistInput {
  id: string;
  name: string;
  role: string;
}

interface SalonSetupPageProps {
  onSetupComplete: () => void;
}

const SERVICE_CATEGORIES = ['Hair', 'Nails', 'Spa', 'Makeup', 'Bridal', 'Skincare', 'Waxing', 'Threading'];

const SUGGESTED_SERVICES: Record<string, ServiceInput[]> = {
  Hair: [
    { id: 'h1', name: 'Haircut', duration: '45', price: '500', category: 'Hair' },
    { id: 'h2', name: 'Hair Coloring', duration: '120', price: '2500', category: 'Hair' },
    { id: 'h3', name: 'Hair Spa Treatment', duration: '60', price: '1500', category: 'Hair' },
    { id: 'h4', name: 'Blow Dry & Styling', duration: '30', price: '800', category: 'Hair' },
    { id: 'h5', name: 'Keratin Treatment', duration: '180', price: '5000', category: 'Hair' },
  ],
  Nails: [
    { id: 'n1', name: 'Manicure', duration: '30', price: '400', category: 'Nails' },
    { id: 'n2', name: 'Pedicure', duration: '45', price: '600', category: 'Nails' },
    { id: 'n3', name: 'Gel Nails', duration: '60', price: '1200', category: 'Nails' },
    { id: 'n4', name: 'Nail Art', duration: '45', price: '800', category: 'Nails' },
  ],
  Spa: [
    { id: 's1', name: 'Full Body Massage', duration: '60', price: '2000', category: 'Spa' },
    { id: 's2', name: 'Head Massage', duration: '30', price: '500', category: 'Spa' },
    { id: 's3', name: 'Aromatherapy', duration: '90', price: '3000', category: 'Spa' },
  ],
  Makeup: [
    { id: 'm1', name: 'Party Makeup', duration: '60', price: '3500', category: 'Makeup' },
    { id: 'm2', name: 'Engagement Makeup', duration: '90', price: '5000', category: 'Makeup' },
    { id: 'm3', name: 'Natural/Everyday Makeup', duration: '30', price: '1500', category: 'Makeup' },
  ],
  Bridal: [
    { id: 'b1', name: 'Bridal Makeup', duration: '120', price: '15000', category: 'Bridal' },
    { id: 'b2', name: 'Mehndi Application', duration: '120', price: '3000', category: 'Bridal' },
    { id: 'b3', name: 'Full Bridal Package', duration: '240', price: '25000', category: 'Bridal' },
  ],
  Skincare: [
    { id: 'sk1', name: 'Facial', duration: '45', price: '1000', category: 'Skincare' },
    { id: 'sk2', name: 'Clean-Up', duration: '30', price: '600', category: 'Skincare' },
    { id: 'sk3', name: 'Chemical Peel', duration: '45', price: '2000', category: 'Skincare' },
  ],
  Waxing: [
    { id: 'w1', name: 'Full Body Wax', duration: '90', price: '2500', category: 'Waxing' },
    { id: 'w2', name: 'Arms & Legs Wax', duration: '45', price: '1000', category: 'Waxing' },
    { id: 'w3', name: 'Eyebrow Wax', duration: '15', price: '200', category: 'Waxing' },
  ],
  Threading: [
    { id: 't1', name: 'Eyebrow Threading', duration: '15', price: '100', category: 'Threading' },
    { id: 't2', name: 'Full Face Threading', duration: '30', price: '300', category: 'Threading' },
    { id: 't3', name: 'Upper Lip Threading', duration: '10', price: '50', category: 'Threading' },
  ],
};

export const SalonSetupPage: React.FC<SalonSetupPageProps> = ({ onSetupComplete }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Salon Details
  const [salonName, setSalonName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Step 2: Services
  const [servicesList, setServicesList] = useState<ServiceInput[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Hair');

  // Step 3: Stylists
  const [stylistsList, setStylistsList] = useState<StylistInput[]>([
    { id: '1', name: '', role: 'Stylist' }
  ]);

  const totalSteps = 4; // Details → Services → Staff → Review

  // Tag management
  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // Service management
  const addSuggestedService = (service: ServiceInput) => {
    if (!servicesList.find(s => s.name === service.name)) {
      setServicesList([...servicesList, { ...service, id: Date.now().toString() + Math.random() }]);
    }
  };

  const addCustomService = () => {
    setServicesList([...servicesList, {
      id: Date.now().toString(),
      name: '',
      duration: '30',
      price: '',
      category: selectedCategory
    }]);
  };

  const updateService = (id: string, field: keyof ServiceInput, value: string) => {
    setServicesList(servicesList.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeService = (id: string) => {
    setServicesList(servicesList.filter(s => s.id !== id));
  };

  // Stylist management
  const addStylist = () => {
    setStylistsList([...stylistsList, {
      id: Date.now().toString(),
      name: '',
      role: 'Stylist'
    }]);
  };

  const updateStylist = (id: string, field: keyof StylistInput, value: string) => {
    setStylistsList(stylistsList.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeStylist = (id: string) => {
    if (stylistsList.length > 1) {
      setStylistsList(stylistsList.filter(s => s.id !== id));
    }
  };

  // Validation
  const isStep1Valid = salonName.trim() && address.trim() && description.trim();
  const isStep2Valid = servicesList.length > 0 && servicesList.every(s => s.name.trim() && s.price && s.duration);
  const isStep3Valid = stylistsList.length > 0 && stylistsList.every(s => s.name.trim());

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      await salons.setup({
        name: salonName.trim(),
        address: address.trim(),
        description: description.trim(),
        image: image.trim() || undefined,
        tags,
        city: city.trim(),
        services: servicesList.map(s => ({
          name: s.name.trim(),
          duration: s.duration,
          price: s.price,
          category: s.category
        })),
        stylists: stylistsList.filter(s => s.name.trim()).map(s => ({
          name: s.name.trim(),
          role: s.role
        }))
      });

      onSetupComplete();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error setting up salon. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[
        { num: 1, label: 'Salon Details', icon: Store },
        { num: 2, label: 'Services', icon: Scissors },
        { num: 3, label: 'Staff', icon: UserPlus },
        { num: 4, label: 'Review', icon: CheckCircle }
      ].map((s, i) => (
        <React.Fragment key={s.num}>
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition ${
              step === s.num
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-200'
                : step > s.num
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-400'
            }`}
            onClick={() => {
              if (s.num < step) setStep(s.num);
            }}
          >
            {step > s.num ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <s.icon className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{s.label}</span>
          </div>
          {i < 3 && (
            <div className={`w-8 h-0.5 mx-1 ${step > s.num ? 'bg-green-300' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tell us about your salon</h2>
        <p className="text-gray-500 mt-1">This information will be displayed to customers browsing salons</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Salon Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={salonName}
          onChange={(e) => setSalonName(e.target.value)}
          placeholder="e.g. Glamour Studio"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <MapPin className="inline h-4 w-4 mr-1" />
            Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 123 Main Street, Kathmandu"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Kathmandu"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <FileText className="inline h-4 w-4 mr-1" />
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your salon, specialties, and what makes it unique..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <Image className="inline h-4 w-4 mr-1" />
          Cover Image URL <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="url"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://example.com/your-salon-image.jpg"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
        />
        {image && (
          <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 h-40">
            <img src={image} alt="Preview" className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <Tag className="inline h-4 w-4 mr-1" />
          Tags <span className="text-gray-400 font-normal">(helps customers find your salon)</span>
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            placeholder="e.g. bridal, hair color, organic"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
          />
          <Button onClick={addTag} variant="outline" size="sm">Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-sm">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-pink-900">×</button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Add your services</h2>
        <p className="text-gray-500 mt-1">Pick from suggestions or add custom services. You can always add more later.</p>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {SERVICE_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              selectedCategory === cat
                ? 'bg-pink-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Suggested services */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-pink-500" />
          Suggested {selectedCategory} Services — click to add
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SUGGESTED_SERVICES[selectedCategory]?.map(service => {
            const isAdded = servicesList.some(s => s.name === service.name);
            return (
              <button
                key={service.id}
                onClick={() => !isAdded && addSuggestedService(service)}
                disabled={isAdded}
                className={`flex items-center justify-between p-3 rounded-lg text-left text-sm transition ${
                  isAdded
                    ? 'bg-green-50 border border-green-200 text-green-700 cursor-default'
                    : 'bg-white border border-gray-200 hover:border-pink-300 hover:bg-pink-50 cursor-pointer'
                }`}
              >
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-xs text-gray-400">{service.duration} min</p>
                </div>
                <div className="text-right">
                  {isAdded ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <span className="font-semibold">Rs. {service.price}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom service button */}
      <button
        onClick={addCustomService}
        className="flex items-center gap-2 text-pink-600 hover:text-pink-700 text-sm font-medium"
      >
        <Plus className="h-4 w-4" /> Add Custom Service
      </button>

      {/* Added services list */}
      {servicesList.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Your Services ({servicesList.length})
          </h3>
          <div className="space-y-3">
            {servicesList.map((service, index) => (
              <div key={service.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-medium">
                    {service.category}
                  </span>
                  <button onClick={() => removeService(service.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={service.name}
                    onChange={(e) => updateService(service.id, 'name', e.target.value)}
                    placeholder="Service name"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={service.duration}
                      onChange={(e) => updateService(service.id, 'duration', e.target.value)}
                      placeholder="Minutes"
                      min="5"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                    <span className="text-xs text-gray-400">min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={service.price}
                      onChange={(e) => updateService(service.id, 'price', e.target.value)}
                      placeholder="Price"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Add your staff</h2>
        <p className="text-gray-500 mt-1">Add the stylists and beauticians who work at your salon</p>
      </div>

      <div className="space-y-4">
        {stylistsList.map((stylist, index) => (
          <div key={stylist.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Staff Member #{index + 1}</span>
              {stylistsList.length > 1 && (
                <button onClick={() => removeStylist(stylist.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={stylist.name}
                onChange={(e) => updateStylist(stylist.id, 'name', e.target.value)}
                placeholder="Full name"
                className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
              />
              <select
                value={stylist.role}
                onChange={(e) => updateStylist(stylist.id, 'role', e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none bg-white"
              >
                <option value="Stylist">Stylist</option>
                <option value="Senior Stylist">Senior Stylist</option>
                <option value="Bridal Expert">Bridal Expert</option>
                <option value="Makeup Artist">Makeup Artist</option>
                <option value="Nail Technician">Nail Technician</option>
                <option value="Spa Therapist">Spa Therapist</option>
                <option value="Hair Colorist">Hair Colorist</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Default schedule: Mon–Sat, 9:00 AM – 5:00 PM. You can adjust this later in the dashboard.
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={addStylist}
        className="flex items-center gap-2 text-pink-600 hover:text-pink-700 text-sm font-medium"
      >
        <Plus className="h-4 w-4" /> Add Another Staff Member
      </button>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Review your salon</h2>
        <p className="text-gray-500 mt-1">Make sure everything looks good before submitting</p>
      </div>

      {/* Salon Preview Card */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="h-48 bg-gradient-to-br from-pink-100 to-purple-100 relative">
          {image && (
            <img src={image} alt={salonName} className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <h3 className="text-xl font-bold text-white">{salonName}</h3>
            <p className="text-white/80 text-sm flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {address}{city ? `, ${city}` : ''}
            </p>
          </div>
        </div>
        <div className="p-5">
          <p className="text-gray-600 text-sm mb-4">{description}</p>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-pink-50 text-pink-700 rounded-full text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Services Summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Scissors className="h-5 w-5 text-pink-500" />
          Services ({servicesList.length})
        </h3>
        <div className="divide-y divide-gray-100">
          {servicesList.map(service => (
            <div key={service.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="font-medium text-sm text-gray-900">{service.name}</p>
                <p className="text-xs text-gray-400">{service.category} · {service.duration} min</p>
              </div>
              <span className="font-semibold text-sm text-gray-900">Rs. {service.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-pink-500" />
          Staff ({stylistsList.filter(s => s.name.trim()).length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stylistsList.filter(s => s.name.trim()).map(stylist => (
            <div key={stylist.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-sm">
                {stylist.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">{stylist.name}</p>
                <p className="text-xs text-gray-500">{stylist.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Your salon will be listed as <em>unverified</em> initially. 
          The admin team will review and verify your salon. You can start receiving bookings immediately.
          You can update all details later from your dashboard.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-pink-50/50 to-white py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" /> Welcome to GlamConnect!
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Set Up Your Salon</h1>
          <p className="text-gray-500 mt-2">Complete these steps to get your salon listed and start receiving bookings</p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 mb-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !isStep1Valid) ||
                (step === 2 && !isStep2Valid) ||
                (step === 3 && !isStep3Valid)
              }
            >
              Continue <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !isStep1Valid || !isStep2Valid || !isStep3Valid}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Setting up...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" /> Create My Salon
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
