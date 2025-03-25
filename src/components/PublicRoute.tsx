import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
  redirectAuthenticated?: string;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ 
  children, 
  redirectAuthenticated = '/' 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Get the redirect path from location state or use default
  const from = location.state?.from?.pathname || redirectAuthenticated;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to the page they were trying to access or home
  if (user) {
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;