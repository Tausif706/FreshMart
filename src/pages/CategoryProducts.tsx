import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, Filter, ChevronDown, ShoppingCart, Star, Grid, List, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  categories: {
    name: string;
  };
}

const CategoryProducts = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [filters, setFilters] = useState({
    inStock: false,
    onSale: false
  });
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  useEffect(() => {
    loadProducts();
    if (user) {
      loadFavorites();
    }
  }, [categorySlug, user, sortBy]);

  useEffect(() => {
    applyFilters();
  }, [products, priceRange, selectedRatings, filters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('products')
        .select('*, categories!inner(*)')
        .eq('categories.slug', categorySlug);
      
      // Apply sorting
      switch (sortBy) {
        case 'price-low':
          query = query.order('price', { ascending: true });
          break;
        case 'price-high':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        default: // featured or any other value
          query = query.order('name', { ascending: true });
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    const { data } = await supabase
      .from('favorites')
      .select('product_id')
      .eq('user_id', user?.id);
    
    if (data) {
      setFavorites(data.map(fav => fav.product_id));
    }
  };

  const toggleFavorite = async (productId: string) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    try {
      if (favorites.includes(productId)) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        setFavorites(favorites.filter(id => id !== productId));
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, product_id: productId });
        setFavorites([...favorites, productId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleAddToCart = async (productId: string) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    try {
      await addToCart(productId, 1);
      
      // Show a toast notification
      const toast = document.getElementById('category-toast');
      if (toast) {
        toast.classList.remove('hidden');
        setTimeout(() => {
          toast.classList.add('hidden');
        }, 3000);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Apply price range filter
    filtered = filtered.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Apply rating filter
    if (selectedRatings.length > 0) {
      filtered = filtered.filter(product => selectedRatings.includes(5)); // Simplified for demo
    }

    // Apply availability filters
    if (filters.inStock) {
      filtered = filtered.filter(product => product.stock > 0);
    }

    if (filters.onSale) {
      filtered = filtered.filter(product => product.price < product.original_price);
    }

    setFilteredProducts(filtered);
  };

  const handleRatingChange = (rating: number) => {
    setSelectedRatings(prev => {
      if (prev.includes(rating)) {
        return prev.filter(r => r !== rating);
      }
      return [...prev, rating];
    });
  };

  const handleApplyFilters = () => {
    applyFilters();
    setShowFilters(false);
  };

  const resetFilters = () => {
    setPriceRange([0, 1000]);
    setSelectedRatings([]);
    setFilters({ inStock: false, onSale: false });
    setFilteredProducts(products);
  };

  const formatCategoryName = (slug: string) => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg h-80"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const FilterPanel = ({ isMobile = false }) => (
    <div className={`${isMobile ? '' : 'hidden md:block w-64 flex-shrink-0'}`}>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          <button
            onClick={resetFilters}
            className="text-sm text-emerald-600 hover:text-emerald-700"
          >
            Reset All
          </button>
        </div>
        
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Price Range</h4>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">${priceRange[0]}</span>
            <span className="text-sm text-gray-600">${priceRange[1]}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1000"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Rating</h4>
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center mb-2">
              <input
                type="checkbox"
                id={`rating-${rating}${isMobile ? '-mobile' : ''}`}
                checked={selectedRatings.includes(rating)}
                onChange={() => handleRatingChange(rating)}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label 
                htmlFor={`rating-${rating}${isMobile ? '-mobile' : ''}`} 
                className="ml-2 text-sm text-gray-600 flex items-center"
              >
                {[...Array(rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
                {[...Array(5 - rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-gray-300" />
                ))}
                <span className="ml-1">& Up</span>
              </label>
            </div>
          ))}
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Availability</h4>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id={`in-stock${isMobile ? '-mobile' : ''}`}
              checked={filters.inStock}
              onChange={(e) => setFilters({ ...filters, inStock: e.target.checked })}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
            />
            <label htmlFor={`in-stock${isMobile ? '-mobile' : ''}`} className="ml-2 text-sm text-gray-600">
              In Stock
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`on-sale${isMobile ? '-mobile' : ''}`}
              checked={filters.onSale}
              onChange={(e) => setFilters({ ...filters, onSale: e.target.checked })}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
            />
            <label htmlFor={`on-sale${isMobile ? '-mobile' : ''}`} className="ml-2 text-sm text-gray-600">
              On Sale
            </label>
          </div>
        </div>
        
        {isMobile && (
          <div className="mt-6 flex space-x-3">
            <button 
              onClick={() => setShowFilters(false)}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
            <button 
              onClick={handleApplyFilters}
              className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-emerald-700"
            >
              Apply Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 capitalize">
              {formatCategoryName(categorySlug || '')}
            </h1>
            <p className="text-gray-600">{filteredProducts.length} products available</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
            </div>
            
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600'}`}
                aria-label="Grid view"
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600'}`}
                aria-label="List view"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center bg-white border border-gray-300 rounded-md py-2 px-3 text-sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Filters */}
          <FilterPanel />
          
          {/* Mobile Filters */}
          {showFilters && (
            <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 flex items-end">
              <div className="bg-white rounded-t-lg w-full p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                  <button onClick={() => setShowFilters(false)}>
                    <X className="h-6 w-6 text-gray-500" />
                  </button>
                </div>
                <FilterPanel isMobile={true} />
              </div>
            </div>
          )}

          {/* Products Grid/List */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500 mb-4">No products found matching your criteria.</p>
                <button
                  onClick={resetFilters}
                  className="bg-emerald-500 text-white px-6 py-2 rounded-md hover:bg-emerald-600"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <motion.div 
                ref={ref}
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
                variants={{
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1
                    }
                  },
                  hidden: {
                    opacity: 0
                  }
                }}
                className={viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
                  : "space-y-6"
                }
              >
                {filteredProducts.map((product) => (
                  viewMode === 'grid' ? (
                    <motion.div 
                      key={product.id} 
                      variants={{
                        visible: { opacity: 1, y: 0 },
                        hidden: { opacity: 0, y: 20 }
                      }}
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100"
                    >
                      <div className="relative">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                        />
                        <button 
                          onClick={() => toggleFavorite(product.id)}
                          className="absolute top-2 right-2 p-2 rounded-full bg-white shadow-md hover:bg-gray-100"
                          aria-label={favorites.includes(product.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Heart 
                            className={`h-5 w-5 ${
                              favorites.includes(product.id) 
                                ? 'text-red-500 fill-current' 
                                : 'text-gray-600'
                            }`} 
                          />
                        </button>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-medium text-gray-900 line-clamp-1">{product.name}</h3>
                        <div className="mt-1 flex items-center">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500 ml-2">(24)</span>
                        </div>
                        {product.description && (
                          <p className="mt-2 text-sm text-gray-500 line-clamp-2">{product.description}</p>
                        )}
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xl font-bold text-gray-900">
                            ${product.price.toFixed(2)}
                          </span>
                          <motion.button
                            onClick={() => handleAddToCart(product.id)}
                            className="bg-emerald-500 text-white p-2 rounded-full hover:bg-emerald-600 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <ShoppingCart className="h-5 w-5" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key={product.id}
                      variants={{
                        visible: { opacity: 1, x: 0 },
                        hidden: { opacity: 0, x: -20 }
                      }}
                      className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 flex"
                    >
                      <div className="w-1/3 relative">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        <button 
                          onClick={() => toggleFavorite(product.id)}
                          className="absolute top-2 right-2 p-2 rounded-full bg-white shadow-md hover:bg-gray-100"
                        >
                          <Heart 
                            className={`h-5 w-5 ${
                              favorites.includes(product.id) 
                                ? 'text-red-500 fill-current' 
                                : 'text-gray-600'
                            }`} 
                          />
                        </button>
                      </div>
                      <div className="w-2/3 p-6">
                        <h3 className="text-xl font-medium text-gray-900">{product.name}</h3>
                        <div className="mt-1 flex items-center">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500 ml-2">(24 reviews)</span>
                        </div>
                        {product.description && (
                          <p className="mt-3 text-gray-600">{product.description}</p>
                        )}
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-2xl font-bold text-gray-900">
                            ${product.price.toFixed(2)}
                          </span>
                          <motion.button
                            onClick={() => handleAddToCart(product.id)}
                            className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <ShoppingCart className="h-5 w-5 mr-2" />
                            Add to Cart
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      <div id="category-toast" className="hidden fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center">
        <ShoppingCart className="h-5 w-5 mr-2" />
        <span>Added to cart!</span>
      </div>
    </div>
  );
};

export default CategoryProducts;