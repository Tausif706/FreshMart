import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export const useAuthMiddleware = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Skip middleware check if still loading auth state
    if (loading) return;

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/signup', '/', '/search', '/category'];

    // Check if current path is a public route
    const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));

    // If not a public route and user is not authenticated, redirect to login
    if (!isPublicRoute && !user) {
      navigate('/login', { 
        state: { from: location },
        replace: true 
      });
    }

    // If user is authenticated and tries to access login/signup, redirect to home
    if (user && (location.pathname === '/login' || location.pathname === '/signup')) {
      navigate('/', { replace: true });
    }
  }, [user, loading, location, navigate]);

  return null;
};