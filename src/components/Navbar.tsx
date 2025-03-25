import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, Search, User, LogOut, Heart, Settings, ChevronDown, X, ShoppingBag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Transition } from '@headlessui/react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCartPreviewOpen, setIsCartPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const cartPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (cartPreviewRef.current && !cartPreviewRef.current.contains(event.target as Node)) {
        setIsCartPreviewOpen(false);
      }
    };

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [user]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const checkAdminStatus = async () => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      setIsAdmin(userData?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearchResults(false);
      setSearchQuery('');
    }
  };

  const handleSearchInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim().length >= 2) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, image_url, price')
          .ilike('name', `%${query}%`)
          .limit(5);
        
        if (error) throw error;
        setSearchResults(data || []);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Error searching products:', error);
      }
    } else {
      setShowSearchResults(false);
    }
  };

  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 focus:outline-none md:hidden"
              aria-expanded={isMenuOpen}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            <Link to="/" className="flex items-center">
              <ShoppingBag className="h-8 w-8 text-emerald-600 mr-2" />
              <span className="text-2xl font-bold text-emerald-600">FreshMart</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex ml-8 space-x-6">
              <Link to="/" className="text-gray-700 hover:text-emerald-600 font-medium">Home</Link>
              <Link to="/category/fresh-produce" className="text-gray-700 hover:text-emerald-600 font-medium">Fresh Produce</Link>
              <Link to="/category/meat-and-seafood" className="text-gray-700 hover:text-emerald-600 font-medium">Meat & Seafood</Link>
              <Link to="/weekly-deals" className="text-gray-700 hover:text-emerald-600 font-medium">Deals</Link>
            </div>
          </div>
          
          <div className="hidden md:flex flex-1 justify-center px-8 relative">
            <form onSubmit={handleSearch} className="relative w-full max-w-lg">
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button type="submit" className="absolute right-3 top-2.5">
                <Search className="h-5 w-5 text-gray-400" />
              </button>
            </form>
            
            <AnimatePresence>
              {showSearchResults && searchResults.length > 0 && (
                <motion.div 
                  ref={searchResultsRef}
                  className="absolute top-full mt-2 w-full max-w-lg bg-white rounded-lg shadow-lg z-10"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ul className="py-2">
                    {searchResults.map((product: any) => (
                      <motion.li 
                        key={product.id} 
                        className="px-4 py-2 hover:bg-gray-100"
                        whileHover={{ backgroundColor: 'rgba(243, 244, 246, 1)' }}
                      >
                        <Link 
                          to={`/product/${product.id}`} 
                          className="flex items-center"
                          onClick={() => {
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                        >
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-10 h-10 object-cover rounded mr-3" 
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">${product.price.toFixed(2)}</p>
                          </div>
                        </Link>
                      </motion.li>
                    ))}
                    <li className="px-4 py-2 border-t">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                        className="text-sm text-emerald-600 hover:text-emerald-800 w-full text-left"
                      >
                        See all results for "{searchQuery}"
                      </button>
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center space-x-4">
            {/* Mobile search button */}
            <button 
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900"
              onClick={() => {
                const searchForm = document.getElementById('mobile-search-form');
                if (searchForm) {
                  searchForm.classList.toggle('hidden');
                }
              }}
            >
              <Search className="h-6 w-6" />
            </button>
            
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center text-gray-700 hover:text-gray-900"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-medium">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </button>
                <Transition
                  show={isUserMenuOpen}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      {user.email}
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/favorites"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <Heart className="h-4 w-4 mr-2" />
                        My Favorites
                      </div>
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      My Orders
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <Settings className="h-4 w-4 mr-2" />
                          Admin Dashboard
                        </div>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsUserMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </div>
                    </button>
                  </div>
                </Transition>
              </div>
            ) : (
              <Link to="/login" className="p-2 rounded-md text-gray-600 hover:text-gray-900 flex items-center">
                <User className="h-6 w-6 mr-1" />
                <span className="hidden sm:inline text-sm font-medium">Sign In</span>
              </Link>
            )}
            <div className="relative">
              <button 
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 relative"
                onClick={() => setIsCartPreviewOpen(!isCartPreviewOpen)}
                onMouseEnter={() => setIsCartPreviewOpen(true)}
              >
                <ShoppingCart className="h-6 w-6" />
                {cartItemsCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                  >
                    {cartItemsCount}
                  </motion.span>
                )}
              </button>
              
              <Transition
                show={isCartPreviewOpen}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
                className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-10 ring-1 ring-black ring-opacity-5"
                ref={cartPreviewRef}
                onMouseLeave={() => setIsCartPreviewOpen(false)}
              >
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-gray-900">Your Cart</h3>
                    <span className="text-sm text-gray-500">{cartItemsCount} items</span>
                  </div>
                  
                  {items.length === 0 ? (
                    <div className="text-center py-6">
                      <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Your cart is empty</p>
                      <button
                        onClick={() => {
                          setIsCartPreviewOpen(false);
                          navigate('/');
                        }}
                        className="mt-3 text-sm text-emerald-600 hover:text-emerald-800"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-60 overflow-y-auto">
                        {items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center py-2 border-b">
                            <img
                              src={item.product?.image_url || 'https://via.placeholder.com/150'}
                              alt={item.product?.name || 'Product'}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.product?.name}</p>
                              <p className="text-xs text-gray-500">{item.quantity} × ${(item.product?.price || 0).toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                        {items.length > 3 && (
                          <div className="text-center py-2 text-sm text-gray-500">
                            +{items.length - 3} more items
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">Subtotal</span>
                          <span className="text-sm font-medium text-gray-900">${cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              navigate('/cart');
                              setIsCartPreviewOpen(false);
                            }}
                            className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-emerald-700"
                          >
                            View Cart
                          </button>
                          <button
                            onClick={() => {
                              navigate('/checkout');
                              setIsCartPreviewOpen(false);
                            }}
                            className="flex-1 bg-gray-800 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-900"
                          >
                            Checkout
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Transition>
            </div>
          </div>
        </div>

        {/* Mobile Search Form */}
        <div id="mobile-search-form" className="md:hidden py-3 hidden">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button type="submit" className="absolute right-3 top-2.5">
              <Search className="h-5 w-5 text-gray-400" />
            </button>
          </form>
        </div>

        {/* Mobile Menu */}
        <Transition
          show={isMenuOpen}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 -translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 -translate-y-1"
          className="md:hidden"
        >
          <div className="py-4 border-t border-gray-200">
            <div className="space-y-1">
              <Link
                to="/"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              {['Fresh Produce', 'Fruits', 'Meat & Seafood', 'Pantry', 'Beverages', 'Household'].map((category) => (
                <Link
                  key={category}
                  to={`/category/${category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category}
                </Link>
              ))}
              <Link
                to="/weekly-deals"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Weekly Deals
              </Link>
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/favorites"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Favorites
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-emerald-600 hover:text-emerald-700 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </Transition>
      </div>
    </nav>
  );
};

export default Navbar;