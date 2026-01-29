import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, RefreshCw, Tag, Percent, DollarSign, Calendar, Copy, Check } from 'lucide-react';
import { promos } from '../../api/client';

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minPurchase: number | null;
  maxUses: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
}

interface PromoFormData {
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: string;
  minPurchase: string;
  maxUses: string;
  validFrom: string;
  validUntil: string;
}

export const PromotionalTools: React.FC = () => {
  const [promoList, setPromoList] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formData, setFormData] = useState<PromoFormData>({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minPurchase: '',
    maxUses: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: ''
  });
  const [saving, setSaving] = useState(false);

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const response = await promos.getAll();
      setPromoList(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const openCreateModal = () => {
    setEditingPromo(null);
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      minPurchase: '',
      maxUses: '',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: ''
    });
    setShowModal(true);
  };

  const openEditModal = (promo: PromoCode) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      description: promo.description || '',
      discountType: promo.discountType,
      discountValue: promo.discountValue.toString(),
      minPurchase: promo.minPurchase?.toString() || '',
      maxUses: promo.maxUses?.toString() || '',
      validFrom: new Date(promo.validFrom).toISOString().split('T')[0],
      validUntil: promo.validUntil ? new Date(promo.validUntil).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      if (editingPromo) {
        await promos.update(editingPromo.id, formData);
      } else {
        await promos.create(formData);
      }
      setShowModal(false);
      fetchPromos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save promo code');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    try {
      await promos.delete(id);
      fetchPromos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete promo code');
    }
  };

  const toggleActive = async (promo: PromoCode) => {
    try {
      await promos.update(promo.id, { isActive: !promo.isActive });
      fetchPromos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update promo code');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isExpired = (promo: PromoCode) => {
    if (!promo.validUntil) return false;
    return new Date(promo.validUntil) < new Date();
  };

  const isMaxedOut = (promo: PromoCode) => {
    if (!promo.maxUses) return false;
    return promo.usedCount >= promo.maxUses;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Promotional Tools</h2>
          <p className="text-sm text-gray-500">Create and manage discount codes</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition"
        >
          <Plus className="h-5 w-5" />
          Create Promo Code
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-sm underline">Dismiss</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Codes</p>
              <p className="text-xl font-bold text-gray-900">
                {promoList.filter(p => p.isActive && !isExpired(p) && !isMaxedOut(p)).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Uses</p>
              <p className="text-xl font-bold text-gray-900">
                {promoList.reduce((sum, p) => sum + p.usedCount, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Expired/Used Up</p>
              <p className="text-xl font-bold text-gray-900">
                {promoList.filter(p => isExpired(p) || isMaxedOut(p)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Promo Code List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {promoList.map((promo) => (
            <div key={promo.id} className="p-6 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    promo.discountType === 'PERCENTAGE' 
                      ? 'bg-purple-50 text-purple-600' 
                      : 'bg-green-50 text-green-600'
                  }`}>
                    {promo.discountType === 'PERCENTAGE' ? (
                      <Percent className="h-6 w-6" />
                    ) : (
                      <DollarSign className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => copyCode(promo.code)}
                        className="flex items-center gap-2 font-mono text-lg font-bold text-gray-900 hover:text-pink-600 transition"
                      >
                        {promo.code}
                        {copiedCode === promo.code ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      
                      {/* Status badges */}
                      {!promo.isActive && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                      {isExpired(promo) && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                          Expired
                        </span>
                      )}
                      {isMaxedOut(promo) && (
                        <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                          Used Up
                        </span>
                      )}
                      {promo.isActive && !isExpired(promo) && !isMaxedOut(promo) && (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 mt-1">
                      {promo.discountType === 'PERCENTAGE' 
                        ? `${promo.discountValue}% off` 
                        : `$${promo.discountValue} off`
                      }
                      {promo.minPurchase && ` on orders over $${promo.minPurchase}`}
                    </p>

                    {promo.description && (
                      <p className="text-sm text-gray-500 mt-1">{promo.description}</p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>Used: {promo.usedCount}{promo.maxUses ? `/${promo.maxUses}` : ''}</span>
                      <span>
                        Valid: {new Date(promo.validFrom).toLocaleDateString()}
                        {promo.validUntil && ` - ${new Date(promo.validUntil).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(promo)}
                    className={`px-3 py-1 text-sm rounded-lg transition ${
                      promo.isActive
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {promo.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => openEditModal(promo)}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(promo.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {promoList.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">No promo codes created yet</p>
              <button
                onClick={openCreateModal}
                className="text-pink-600 hover:text-pink-700 font-medium"
              >
                Create your first promo code
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Promo Code Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono uppercase"
                    placeholder="SUMMER20"
                    required
                    disabled={!!editingPromo}
                  />
                  {!editingPromo && (
                    <button
                      type="button"
                      onClick={generateCode}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                    >
                      Generate
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Summer sale discount"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder={formData.discountType === 'PERCENTAGE' ? '20' : '10.00'}
                    min="0"
                    max={formData.discountType === 'PERCENTAGE' ? '100' : undefined}
                    step={formData.discountType === 'PERCENTAGE' ? '1' : '0.01'}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min. Purchase (optional)
                  </label>
                  <input
                    type="number"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="50.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Uses (optional)
                  </label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="100"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid Until (optional)
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingPromo ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
