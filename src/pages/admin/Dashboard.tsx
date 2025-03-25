import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ShoppingBag, Tag, BarChart2, Users, Package, Calendar } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [stats, setStats] = React.useState({
    products: 0,
    categories: 0,
    orders: 0,
    users: 0
  });

  React.useEffect(() => {
    checkAdminStatus();
    loadStats();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      navigate('/');
      return;
    }

    setIsAdmin(true);
  };

  const loadStats = async () => {
    try {
      // Get product count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Get categories count
      const { count: categoriesCount } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });

      // Get orders count
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Get users count - using direct count for all users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id');

      if (usersError) throw usersError;
      const usersCount = usersData?.length || 0;

      setStats({
        products: productsCount || 0,
        categories: categoriesCount || 0,
        orders: ordersCount || 0,
        users: usersCount
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  if (!isAdmin) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-emerald-100 text-emerald-500 mr-4">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.products}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                <Tag className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.categories}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.orders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.users}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Admin Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Tag className="h-6 w-6 text-emerald-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Categories</h2>
            </div>
            <p className="text-gray-600 mb-4">Manage product categories</p>
            <button
              onClick={() => navigate('/admin/categories')}
              className="bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600 w-full"
            >
              Manage Categories
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Package className="h-6 w-6 text-emerald-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Products</h2>
            </div>
            <p className="text-gray-600 mb-4">Manage store products</p>
            <button
              onClick={() => navigate('/admin/products')}
              className="bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600 w-full"
            >
              Manage Products
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-6 w-6 text-emerald-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Weekly Deals</h2>
            </div>
            <p className="text-gray-600 mb-4">Manage special offers and deals</p>
            <button
              onClick={() => navigate('/admin/weekly-deals')}
              className="bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600 w-full"
            >
              Manage Deals
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <ShoppingBag className="h-6 w-6 text-emerald-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Orders</h2>
            </div>
            <p className="text-gray-600 mb-4">View and manage customer orders</p>
            <button
              onClick={() => navigate('/admin/orders')}
              className="bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600 w-full"
            >
              Manage Orders
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 text-emerald-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Users</h2>
            </div>
            <p className="text-gray-600 mb-4">Manage user accounts</p>
            <button
              onClick={() => navigate('/admin/users')}
              className="bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600 w-full"
            >
              Manage Users
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <BarChart2 className="h-6 w-6 text-emerald-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Reports</h2>
            </div>
            <p className="text-gray-600 mb-4">View sales and analytics reports</p>
            <button
              onClick={() => navigate('/admin/reports')}
              className="bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600 w-full"
            >
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;