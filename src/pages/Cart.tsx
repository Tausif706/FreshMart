import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft, Truck, CreditCard, Shield } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Cart = () => {
  const { items, loading, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading your cart...</p>
        </div>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * item.quantity;
  }, 0);
  
  const shipping = subtotal > 50 ? 0 : 5.99;
  const discount = promoApplied ? promoDiscount : 0;
  const total = subtotal + shipping - discount;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.toLowerCase() === 'fresh10') {
      setPromoApplied(true);
      setPromoDiscount(subtotal * 0.1); // 10% discount
      
      const toast = document.getElementById('promo-toast');
      if (toast) {
        toast.classList.remove('hidden');
        toast.classList.add('bg-green-600');
        toast.innerHTML = '<span>Promo code applied successfully!</span>';
        setTimeout(() => {
          toast.classList.add('hidden');
        }, 3000);
      }
    } else {
      const toast = document.getElementById('promo-toast');
      if (toast) {
        toast.classList.remove('hidden');
        toast.classList.add('bg-red-600');
        toast.innerHTML = '<span>Invalid promo code</span>';
        setTimeout(() => {
          toast.classList.add('hidden');
        }, 3000);
      }
    }
    setPromoCode('');
  };

  const handleCheckout = async () => {
    if (!user?.id || items.length === 0) return;

    try {
      setProcessingOrder(true);

      // Get user's shipping address
      const { data: userData } = await supabase
        .from('users')
        .select('address')
        .eq('id', user.id)
        .single();

      if (!userData?.address) {
        alert('Please add a shipping address in your profile before checking out.');
        navigate('/profile');
        return;
      }

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
          shipping_address: userData.address,
          status: 'pending',
          approval_status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Add order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product?.price || 0
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Get all admin users
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin');

      if (admins) {
        // Create approval requests for each admin
        const approvals = admins.map(admin => ({
          order_id: order.id,
          admin_id: admin.id,
          status: 'pending'
        }));

        const { error: approvalError } = await supabase
          .from('order_approvals')
          .insert(approvals);

        if (approvalError) throw approvalError;
      }

      // Clear the cart
      await clearCart();
      setOrderSuccess(true);

      // Show success message
      const toast = document.getElementById('order-toast');
      if (toast) {
        toast.classList.remove('hidden');
        toast.classList.add('bg-green-600');
        toast.innerHTML = '<span>Order placed successfully! Waiting for admin approval.</span>';
        setTimeout(() => {
          toast.classList.add('hidden');
          navigate('/profile'); // Redirect to profile/orders page
        }, 3000);
      }

    } catch (error) {
      console.error('Error processing order:', error);
      alert('Failed to process order. Please try again.');
    } finally {
      setProcessingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <span className="text-gray-600">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="flex justify-center mb-4">
              <ShoppingCart className="h-16 w-16 text-gray-300" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't added any products to your cart yet.</p>
            <motion.button 
              onClick={() => navigate('/')}
              className="bg-emerald-500 text-white px-6 py-3 rounded-md hover:bg-emerald-600 inline-flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Continue Shopping
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Cart Items</h2>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to clear your cart?')) {
                          clearCart();
                        }
                      }}
                      className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear Cart
                    </button>
                  </div>
                </div>
                <ul className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <motion.li 
                      key={item.id} 
                      className="p-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center">
                        <img
                          src={item.product?.image_url || 'https://via.placeholder.com/150'}
                          alt={item.product?.name || 'Product'}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="ml-6 flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {item.product?.name || 'Product'}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            ${(item.product?.price || 0).toFixed(2)} each
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center border border-gray-300 rounded-full">
                            <button
                              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              className="p-1 rounded-full hover:bg-gray-100 focus:outline-none"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-4 w-4 text-gray-500" />
                            </button>
                            <span className="w-8 text-center text-gray-900">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 rounded-full hover:bg-gray-100 focus:outline-none"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-4 w-4 text-gray-500" />
                            </button>
                          </div>
                          <div className="text-right min-w-[80px]">
                            <div className="text-gray-900 font-medium">
                              ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-600 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                    <Truck className="h-8 w-8 text-emerald-500 mr-4" />
                    <div>
                      <h4 className="font-medium text-gray-900">Free Shipping</h4>
                      <p className="text-sm text-gray-500">For orders over $50</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                    <Shield className="h-8 w-8 text-emerald-500 mr-4" />
                    <div>
                      <h4 className="font-medium text-gray-900">Secure Checkout</h4>
                      <p className="text-sm text-gray-500">100% protected process</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="bg-white rounded-lg shadow p-6 sticky top-24">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900 font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900 font-medium">
                      {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  {promoApplied && (
                    <div className="flex items-center justify-between text-green-600">
                      <span>Discount (10%)</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-gray-200">
                    <form onSubmit={handleApplyPromo} className="flex mb-4">
                      <input
                        type="text"
                        placeholder="Promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="submit"
                        className="bg-gray-800 text-white px-4 py-2 rounded-r-md hover:bg-gray-700"
                      >
                        Apply
                      </button>
                    </form>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-gray-900">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      Tax included if applicable
                    </p>
                  </div>
                  <motion.button 
                    onClick={handleCheckout}
                    disabled={processingOrder || orderSuccess}
                    className="w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 flex items-center justify-center disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {processingOrder ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Proceed to Checkout
                      </>
                    )}
                  </motion.button>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full text-emerald-600 py-2 px-4 rounded-md hover:bg-emerald-50 focus:outline-none flex items-center justify-center"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Continue Shopping
                  </button>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">We Accept</h3>
                  <div className="flex space-x-2">
                    <img src="https://cdn-icons-png.flaticon.com/512/196/196578.png" alt="Visa" className="h-8" />
                    <img src="https://cdn-icons-png.flaticon.com/512/196/196561.png" alt="MasterCard" className="h-8" />
                    <img src="https://cdn-icons-png.flaticon.com/512/196/196539.png" alt="PayPal" className="h-8" />
                    <img src="https://cdn-icons-png.flaticon.com/512/196/196565.png" alt="American Express" className="h-8" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Toast Notifications */}
      <div id="promo-toast" className="hidden fixed bottom-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center">
        <span>Promo code applied successfully!</span>
      </div>
      <div id="order-toast" className="hidden fixed bottom-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center">
        <span>Order placed successfully!</span>
      </div>
    </div>
  );
};

export default Cart;