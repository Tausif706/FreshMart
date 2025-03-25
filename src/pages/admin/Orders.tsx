import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, Eye, Truck, CheckCircle, AlertCircle, X, Check, Bell } from 'lucide-react';

interface Order {
  id: string;
  user_id: string;
  status: string;
  approval_status: string;
  total_amount: number;
  shipping_address: string;
  created_at: string;
  tracking_number: string | null;
  tracking_url: string | null;
  estimated_delivery: string | null;
  delivery_status: string;
  users: {
    email: string;
    full_name: string;
  };
  order_items: {
    id: string;
    quantity: number;
    price: number;
    products: {
      name: string;
      image_url: string;
    };
  }[];
}

interface Notification {
  id: string;
  order_id: string;
  status: string;
  created_at: string;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState({
    tracking_number: '',
    tracking_url: '',
    estimated_delivery: '',
    delivery_status: 'pending'
  });

  useEffect(() => {
    loadOrders();
    loadNotifications();
    subscribeToNotifications();
  }, []);

  // When an order is selected, update the tracking info state
  useEffect(() => {
    if (selectedOrder) {
      setTrackingInfo({
        tracking_number: selectedOrder.tracking_number || '',
        tracking_url: selectedOrder.tracking_url || '',
        estimated_delivery: selectedOrder.estimated_delivery?.split('T')[0] || '',
        delivery_status: selectedOrder.delivery_status || 'pending'
      });
    }
  }, [selectedOrder]);

  const subscribeToNotifications = () => {
    const notificationsSubscription = supabase
      .channel('admin_notifications_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications'
        },
        (payload) => {
          loadNotifications();
          // Show browser notification
          if (Notification.permission === 'granted') {
            new Notification('New Order Pending Approval', {
              body: `Order #${payload.new.order_id.slice(0, 8)} needs your approval`,
              icon: '/favicon.ico'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsSubscription);
    };
  };

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;
      await loadNotifications();
    } catch (err) {
      console.error('Error updating notification:', err);
    }
  };

  useEffect(() => {
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users (email, full_name),
          order_items (
            id,
            quantity,
            price,
            products (name, image_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status');
    }
  };

  const handleApproval = async (orderId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          approval_status: approved ? 'approved' : 'rejected',
          status: approved ? 'processing' : 'cancelled'
        })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              approval_status: approved ? 'approved' : 'rejected',
              status: approved ? 'processing' : 'cancelled'
            } 
          : order
      ));

      // Update selected order if open
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? {
          ...prev,
          approval_status: approved ? 'approved' : 'rejected',
          status: approved ? 'processing' : 'cancelled'
        } : null);
      }

      // Mark related notification as read
      const notification = notifications.find(n => n.order_id === orderId);
      if (notification) {
        await markNotificationAsRead(notification.id);
      }

      // Show success message
      alert(`Order ${approved ? 'approved' : 'rejected'} successfully`);
    } catch (err) {
      console.error('Error updating approval status:', err);
      setError('Failed to update approval status');
    }
  };

  const updateTrackingInfo = async () => {
    if (!selectedOrder) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          tracking_number: trackingInfo.tracking_number || null,
          tracking_url: trackingInfo.tracking_url || null,
          estimated_delivery: trackingInfo.estimated_delivery || null,
          delivery_status: trackingInfo.delivery_status,
          status: trackingInfo.delivery_status === 'delivered' ? 'delivered' : 'shipped'
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      // Update local state
      const updatedOrder = {
        ...selectedOrder,
        tracking_number: trackingInfo.tracking_number,
        tracking_url: trackingInfo.tracking_url,
        estimated_delivery: trackingInfo.estimated_delivery,
        delivery_status: trackingInfo.delivery_status,
        status: trackingInfo.delivery_status === 'delivered' ? 'delivered' : 'shipped'
      };

      setOrders(orders.map(order => 
        order.id === selectedOrder.id ? updatedOrder : order
      ));
      setSelectedOrder(updatedOrder);

      alert('Tracking information updated successfully');
    } catch (err) {
      console.error('Error updating tracking info:', err);
      setError('Failed to update tracking information');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <Bell className="h-6 w-6" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b">
                    <h3 className="text-lg font-medium">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((notification) => {
                        const order = orders.find(o => o.id === notification.order_id);
                        return (
                          <div
                            key={notification.id}
                            className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              const order = orders.find(o => o.id === notification.order_id);
                              if (order) {
                                setSelectedOrder(order);
                                setShowNotifications(false);
                              }
                            }}
                          >
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <Package className="h-6 w-6 text-emerald-500" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">
                                  New Order #{notification.order_id.slice(0, 8)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {order?.users.email}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {new Date(notification.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              Total Orders: {orders.length}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Package className="h-6 w-6 text-emerald-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          #{order.id.slice(0, 8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.users?.full_name || 'No name'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order?.users?.email || 'No email'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.approval_status)}`}>
                        {order.approval_status}
                      </span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${order.total_amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {order.approval_status === 'pending' && (
                      <div className="flex justify-end space-x-2 mb-2">
                        <button
                          onClick={() => handleApproval(order.id, true)}
                          className="bg-green-100 text-green-800 px-2 py-1 rounded-md hover:bg-green-200"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleApproval(order.id, false)}
                          className="bg-red-100 text-red-800 px-2 py-1 rounded-md hover:bg-red-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-emerald-600 hover:text-emerald-900"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      {order.approval_status === 'approved' && (
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="rounded-md border-gray-300 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Order #{selectedOrder.id.slice(0, 8)}
                  </h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Customer Information</h3>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>{selectedOrder.users?.full_name || 'No name'}</p>
                      <p>{selectedOrder.users?.email || 'No email'}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Shipping Address</h3>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>{selectedOrder.shipping_address}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
                    <div className="mt-2 space-y-4">
                      {selectedOrder.order_items.map((item) => (
                        <div key={item.id} className="flex items-center">
                          <img
                            src={item.products.image_url}
                            alt={item.products.name}
                            className="h-16 w-16 object-cover rounded"
                          />
                          <div className="ml-4 flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.products.name}</p>
                            <p className="text-sm text-gray-500">
                              {item.quantity} × ${item.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            ${(item.quantity * item.price).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-lg font-medium text-gray-900">
                      <span>Total</span>
                      <span>${selectedOrder.total_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  {selectedOrder.approval_status === 'approved' && (
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Tracking Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Tracking Number
                          </label>
                          <input
                            type="text"
                            value={trackingInfo.tracking_number}
                            onChange={(e) => setTrackingInfo({ ...trackingInfo, tracking_number: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Tracking URL
                          </label>
                          <input
                            type="url"
                            value={trackingInfo.tracking_url}
                            onChange={(e) => setTrackingInfo({ ...trackingInfo, tracking_url: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Estimated Delivery Date
                          </label>
                          <input
                            type="date"
                            value={trackingInfo.estimated_delivery}
                            onChange={(e) => setTrackingInfo({ ...trackingInfo, estimated_delivery: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Delivery Status
                          </label>
                          <select
                            value={trackingInfo.delivery_status}
                            onChange={(e) => setTrackingInfo({ ...trackingInfo, delivery_status: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_transit">In Transit</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </div>
                        <button
                          onClick={updateTrackingInfo}
                          className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                          Update Tracking Information
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Order Status</h3>
                    <div className="flex items-center space-x-2">
                      {['pending', 'processing', 'shipped', 'delivered'].map((status, index) => (
                        <React.Fragment key={status}>
                          <div className={`flex items-center ${
                            selectedOrder.status === status ? 'text-emerald-600' : 'text-gray-400'
                          }`}>
                            {status === 'pending' && <AlertCircle className="h-5 w-5" />}
                            {status === 'processing' && <Package className="h-5 w-5" />}
                            {status === 'shipped' && <Truck className="h-5 w-5" />}
                            {status === 'delivered' && <CheckCircle className="h-5 w-5" />}
                            <span className="ml-1 text-sm capitalize">{status}</span>
                          </div>
                          {index < 3 && (
                            <div className={`h-0.5 w-4 ${
                              selectedOrder.status === status ? 'bg-emerald-600' : 'bg-gray-200'
                            }`} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;