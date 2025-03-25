import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Clock, ShoppingCart, Tag, Percent } from 'lucide-react';

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

const WeeklyDeals = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  useEffect(() => {
    loadWeeklyDeals();
  }, []);

  useEffect(() => {
    if (deals.length > 0) {
      const endDate = new Date(deals[0].end_date);
      const timer = setInterval(() => {
        const now = new Date();
        const difference = endDate.getTime() - now.getTime();
        
        if (difference <= 0) {
          clearInterval(timer);
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          return;
        }
        
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft({ days, hours, minutes, seconds });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [deals]);

  const loadWeeklyDeals = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('weekly_deals')
        .select('*')
        .lte('start_date', today)
        .gte('end_date', today)
        .order('discount', { ascending: false })
        .limit(3);

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error('Error loading weekly deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (dealId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await addToCart(dealId, 1);
      
      // Show a toast notification
      const toast = document.getElementById('deal-toast');
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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  if (loading) {
    return (
      <section className="py-12 bg-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Weekly Deals</h2>
            <div className="animate-pulse flex justify-center">
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg h-80"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (deals.length === 0) {
    return (
      <section className="py-12 bg-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Weekly Deals</h2>
            <p className="text-lg text-gray-600">No active deals at the moment. Check back soon!</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Weekly Deals</h2>
          <p className="text-lg text-gray-600 mb-4">Save big on these special offers</p>
          
          {/* Countdown timer */}
          <div className="inline-flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
            <Clock className="h-5 w-5 text-emerald-500 mr-2" />
            <span className="text-gray-700 font-medium">Ends in:</span>
            <div className="ml-3 flex space-x-2">
              <div className="bg-emerald-600 text-white px-2 py-1 rounded">
                {timeLeft.days.toString().padStart(2, '0')}
                <span className="text-xs block">days</span>
              </div>
              <div className="bg-emerald-600 text-white px-2 py-1 rounded">
                {timeLeft.hours.toString().padStart(2, '0')}
                <span className="text-xs block">hrs</span>
              </div>
              <div className="bg-emerald-600 text-white px-2 py-1 rounded">
                {timeLeft.minutes.toString().padStart(2, '0')}
                <span className="text-xs block">min</span>
              </div>
              <div className="bg-emerald-600 text-white px-2 py-1 rounded">
                {timeLeft.seconds.toString().padStart(2, '0')}
                <span className="text-xs block">sec</span>
              </div>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          ref={ref}
          variants={container}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {deals.map((deal) => (
            <motion.div 
              key={deal.id} 
              variants={item}
              whileHover={{ y: -8 }}
              className="bg-white rounded-lg shadow-md overflow-hidden transform transition-all"
            >
              <div className="relative">
                <img
                  src={deal.image_url}
                  alt={deal.name}
                  className="w-full h-56 object-cover"
                />
                <div className="absolute top-0 right-0 bg-red-500 text-white px-4 py-2 rounded-bl-lg flex items-center">
                  <Percent className="h-4 w-4 mr-1" />
                  <span className="font-bold">{deal.discount}% OFF</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                  <h3 className="text-xl font-bold text-white">{deal.name}</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4 line-clamp-2">{deal.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">${deal.sale_price.toFixed(2)}</span>
                    <span className="ml-2 text-sm text-gray-500 line-through">${deal.original_price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center text-emerald-600">
                    <Tag className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">You save: ${(deal.original_price - deal.sale_price).toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Valid until: {new Date(deal.end_date).toLocaleDateString()}
                  </div>
                  <motion.button
                    onClick={() => handleAddToCart(deal.id)}
                    className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 text-center"
        >
          <button
            onClick={() => navigate('/weekly-deals')}
            className="inline-flex items-center bg-white border border-emerald-500 text-emerald-600 px-6 py-3 rounded-full text-lg font-medium hover:bg-emerald-50 transition-colors"
          >
            View All Deals
            <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </motion.div>
      </div>
      
      {/* Toast Notification */}
      <div id="deal-toast" className="hidden fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center">
        <ShoppingCart className="h-5 w-5 mr-2" />
        <span>Deal added to cart!</span>
      </div>
    </section>
  );
};

export default WeeklyDeals;