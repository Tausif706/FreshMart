import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Deal {
  id: string;
  name: string;
  description: string;
  original_price: number;
  sale_price: number;
  discount: number;
  image_url: string;
  start_date: string;
  end_date: string;
}

const AdminWeeklyDeals = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newDeal, setNewDeal] = useState({
    name: '',
    description: '',
    original_price: 0,
    sale_price: 0,
    discount: 0,
    image_url: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('weekly_deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (err) {
      console.error('Error loading deals:', err);
      setError('Failed to load weekly deals');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Calculate discount if not provided
      let dealToAdd = { ...newDeal };
      if (!dealToAdd.discount && dealToAdd.original_price && dealToAdd.sale_price) {
        dealToAdd.discount = Math.round(
          ((dealToAdd.original_price - dealToAdd.sale_price) / dealToAdd.original_price) * 100
        );
      }

      // Add created_at timestamp
      const now = new Date().toISOString();
      dealToAdd = {
        ...dealToAdd,
        created_at: now
      };

      const { error } = await supabase
        .from('weekly_deals')
        .insert([dealToAdd]);

      if (error) {
        console.error('Error details:', error);
        throw error;
      }
      
      setNewDeal({
        name: '',
        description: '',
        original_price: 0,
        sale_price: 0,
        discount: 0,
        image_url: '',
        start_date: '',
        end_date: ''
      });
      setIsAdding(false);
      loadDeals();
    } catch (err) {
      console.error('Error adding deal:', err);
      setError('Failed to add weekly deal. Please check console for details.');
    }
  };

  const handleDeleteDeal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      const { error } = await supabase
        .from('weekly_deals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadDeals();
    } catch (err) {
      console.error('Error deleting deal:', err);
      setError('Failed to delete weekly deal');
    }
  };

  const calculateDiscount = () => {
    if (newDeal.original_price && newDeal.sale_price) {
      const discount = Math.round(
        ((newDeal.original_price - newDeal.sale_price) / newDeal.original_price) * 100
      );
      setNewDeal({ ...newDeal, discount });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Weekly Deals</h1>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Deal
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {isAdding && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Add New Weekly Deal</h2>
            <form onSubmit={handleAddDeal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={newDeal.name}
                  onChange={(e) => setNewDeal({ ...newDeal, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newDeal.description}
                  onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Original Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newDeal.original_price}
                    onChange={(e) => setNewDeal({ ...newDeal, original_price: parseFloat(e.target.value) })}
                    onBlur={calculateDiscount}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sale Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newDeal.sale_price}
                    onChange={(e) => setNewDeal({ ...newDeal, sale_price: parseFloat(e.target.value) })}
                    onBlur={calculateDiscount}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newDeal.discount}
                    onChange={(e) => setNewDeal({ ...newDeal, discount: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Image URL</label>
                <input
                  type="text"
                  value={newDeal.image_url}
                  onChange={(e) => setNewDeal({ ...newDeal, image_url: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use a valid image URL (e.g., https://images.unsplash.com/...)
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={newDeal.start_date}
                    onChange={(e) => setNewDeal({ ...newDeal, start_date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={newDeal.end_date}
                    onChange={(e) => setNewDeal({ ...newDeal, end_date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {deals.map((deal) => (
              <li key={deal.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <img 
                    src={deal.image_url} 
                    alt={deal.name} 
                    className="h-16 w-16 object-cover rounded-md mr-4"
                  />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{deal.name}</h3>
                    <p className="text-sm text-gray-500">
                      <span className="line-through">${deal.original_price.toFixed(2)}</span>
                      <span className="ml-2 text-red-500">${deal.sale_price.toFixed(2)}</span>
                      <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                        {deal.discount}% OFF
                      </span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Valid: {new Date(deal.start_date).toLocaleDateString()} - {new Date(deal.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteDeal(deal.id)}
                    className="text-red-400 hover:text-red-500"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminWeeklyDeals;