import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart, LineChart, PieChart, TrendingUp, DollarSign, ShoppingBag, Users } from 'lucide-react';

interface SalesData {
  date: string;
  total: number;
}

interface CategorySales {
  category: string;
  total: number;
}

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
}

const AdminReports = () => {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalCustomers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('week'); // week, month, year

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // Get date range
      const now = new Date();
      let startDate = new Date();
      switch (dateRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Get sales data
      const { data: salesData, error: salesError } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      if (salesError) throw salesError;

      // Get category sales
      const { data: categoryData, error: categoryError } = await supabase
        .from('order_items')
        .select(`
          quantity,
          price,
          products (
            categories (
              name
            )
          )
        `)
        .gte('created_at', startDate.toISOString());

      if (categoryError) throw categoryError;

      // Process sales data
      const processedSalesData = processSalesData(salesData || []);
      setSalesData(processedSalesData);

      // Process category sales
      const processedCategoryData = processCategorySales(categoryData || []);
      setCategorySales(processedCategoryData);

      // Calculate dashboard stats
      const dashboardStats = calculateDashboardStats(salesData || []);
      setStats(dashboardStats);

    } catch (err) {
      console.error('Error loading report data:', err);
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const processSalesData = (data: any[]): SalesData[] => {
    const salesByDate = data.reduce((acc: { [key: string]: number }, order) => {
      const date = new Date(order.created_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + order.total_amount;
      return acc;
    }, {});

    return Object.entries(salesByDate).map(([date, total]) => ({
      date,
      total: Number(total)
    }));
  };

  const processCategorySales = (data: any[]): CategorySales[] => {
    const categoryTotals = data.reduce((acc: { [key: string]: number }, item) => {
      const category = item.products?.categories?.name || 'Uncategorized';
      const total = item.quantity * item.price;
      acc[category] = (acc[category] || 0) + total;
      return acc;
    }, {});

    return Object.entries(categoryTotals).map(([category, total]) => ({
      category,
      total: Number(total)
    }));
  };

  const calculateDashboardStats = (data: any[]): DashboardStats => {
    const totalSales = data.reduce((sum, order) => sum + order.total_amount, 0);
    const totalOrders = data.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      totalCustomers: data.length // This should be unique customers in a real implementation
    };
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
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Sales</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${stats.totalSales.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalOrders}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Average Order Value</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${stats.averageOrderValue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <Users className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Customers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalCustomers}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Sales Trend</h2>
              <LineChart className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-64">
              {/* Implement chart visualization here */}
              <div className="flex h-full items-end space-x-2">
                {salesData.map((data, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-emerald-100 hover:bg-emerald-200 transition-colors rounded-t"
                    style={{
                      height: `${(data.total / Math.max(...salesData.map(d => d.total))) * 100}%`
                    }}
                  >
                    <div className="transform -rotate-45 text-xs text-gray-500 mt-2 ml-2">
                      {data.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category Sales */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Sales by Category</h2>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {categorySales.map((category, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-32 truncate">
                    <span className="text-sm font-medium text-gray-900">
                      {category.category}
                    </span>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-emerald-600 h-2.5 rounded-full"
                        style={{
                          width: `${(category.total / Math.max(...categorySales.map(c => c.total))) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <span className="text-sm font-medium text-gray-900">
                      ${category.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="flow-root">
              <ul className="-mb-8">
                {salesData.slice(0, 5).map((data, index) => (
                  <li key={index}>
                    <div className="relative pb-8">
                      {index !== salesData.length - 1 && (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center ring-8 ring-white">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              Sales on {data.date}
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-900">
                            ${data.total.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;