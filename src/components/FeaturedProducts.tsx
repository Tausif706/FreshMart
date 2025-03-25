import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category_name: string;
  total_quantity?: number;
}

const FeaturedProducts = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  useEffect(() => {
    loadFeaturedProducts();
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFeaturedProducts = async () => {
    try {
      // First try to get products from the featured_products_view (best sellers)
      let { data, error } = await supabase
        .from('featured_products_view')
        .select('id, name, price, image_url, category_name, total_quantity')
        .order('total_quantity', { ascending: false })
        .limit(8);

      // If the view doesn't exist or there's an error, fall back to recent products
      if (error || !data || data.length === 0) {
        console.log('Falling back to recent products:', error);
        const { data: recentProducts, error: recentError } = await supabase
          .from('products')
          .select('id, name, price, image_url, categories(name)')
          .order('created_at', { ascending: false })
          .limit(8);

        if (recentError) throw recentError;
        
        // Transform the data to match the expected format
        data = recentProducts?.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          category_name: product.categories?.name || 'Uncategorized'
        })) || [];
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error loading featured products:', error);
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
      const toast = document.getElementById('toast');
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

  if (loading) {
    return (
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Products</h2>
          <div className="flex justify-center">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-6 py-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-200 rounded-lg h-80"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
        >
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Products</h2>
            <p className="text-gray-600">Our most popular items based on customer purchases</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <button className="swiper-button-prev-custom bg-white border border-gray-300 rounded-full p-2 hover:bg-gray-100 transition-colors">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button className="swiper-button-next-custom bg-white border border-gray-300 rounded-full p-2 hover:bg-gray-100 transition-colors">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </motion.div>

        {products.length === 0 ? (
          <div className="text-center text-gray-500">No featured products available</div>
        ) : (
          <div ref={ref}>
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={24}
              slidesPerView={1}
              breakpoints={{
                640: { slidesPerView: 2 },
                768: { slidesPerView: 3 },
                1024: { slidesPerView: 4 },
              }}
              navigation={{
                prevEl: '.swiper-button-prev-custom',
                nextEl: '.swiper-button-next-custom',
              }}
              pagination={{ clickable: true }}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              className="pb-12"
            >
              {products.map((product) => (
                <SwiperSlide key={product.id}>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-lg shadow-sm overflow-hidden h-full border border-gray-100"
                  >
                    <div className="relative">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                        onClick={() => setQuickViewProduct(product)}
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
                      {product.total_quantity && product.total_quantity > 0 && (
                        <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          Best Seller
                        </div>
                      )}
                      <button
                        onClick={() => setQuickViewProduct(product)}
                        className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 text-gray-800 px-4 py-1 rounded-full text-sm font-medium hover:bg-opacity-100 transition-all opacity-0 group-hover:opacity-100"
                      >
                        Quick View
                      </button>
                    </div>
                    <div className="p-4">
                      <span className="text-sm text-emerald-600 font-medium">
                        {product.category_name || 'Uncategorized'}
                      </span>
                      <h3 className="mt-1 text-lg font-medium text-gray-900 line-clamp-1">{product.name}</h3>
                      <div className="mt-1 flex items-center">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-2">(24 reviews)</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                        <motion.button 
                          onClick={() => handleAddToCart(product.id)}
                          className="bg-emerald-500 text-white p-2 rounded-full text-sm font-medium hover:bg-emerald-600 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <ShoppingCart className="h-5 w-5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              <div>
                <img 
                  src={quickViewProduct.image_url} 
                  alt={quickViewProduct.name} 
                  className="w-full h-auto object-cover rounded-lg"
                />
              </div>
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm text-emerald-600 font-medium">
                      {quickViewProduct.category_name || 'Uncategorized'}
                    </span>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{quickViewProduct.name}</h3>
                  </div>
                  <button 
                    onClick={() => setQuickViewProduct(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mt-4 flex items-center">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 ml-2">(24 reviews)</span>
                </div>
                
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-900">${quickViewProduct.price.toFixed(2)}</span>
                  {quickViewProduct.total_quantity && quickViewProduct.total_quantity > 0 && (
                    <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Best Seller
                    </span>
                  )}
                </div>
                
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-900">Description</h4>
                  <p className="mt-2 text-gray-600">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl vel ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.
                  </p>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900">Highlights</h4>
                  <ul className="mt-2 space-y-2">
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-2 text-gray-600">Fresh and organic</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-2 text-gray-600">Locally sourced</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-2 text-gray-600">High quality</span>
                    </li>
                  </ul>
                </div>
                
                <div className="mt-8 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <motion.button
                    onClick={() => handleAddToCart(quickViewProduct.id)}
                    className="flex-1 bg-emerald-600 text-white py-3 px-6 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </motion.button>
                  <motion.button
                    onClick={() => toggleFavorite(quickViewProduct.id)}
                    className={`flex-1 py-3 px-6 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center ${
                      favorites.includes(quickViewProduct.id)
                        ? 'bg-red-50 text-red-600 border-red-200 focus:ring-red-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-gray-500'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Heart className={`h-5 w-5 mr-2 ${favorites.includes(quickViewProduct.id) ? 'fill-current' : ''}`} />
                    {favorites.includes(quickViewProduct.id) ? 'Saved' : 'Save'}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Toast Notification */}
      <div id="toast" className="hidden fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center">
        <ShoppingCart className="h-5 w-5 mr-2" />
        <span>Added to cart!</span>
      </div>
    </section>
  );
};

export default FeaturedProducts;