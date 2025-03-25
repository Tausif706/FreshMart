import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface RBACProps {
  requiredRole?: 'admin' | 'user';
}

export const useRBAC = ({ requiredRole }: RBACProps = {}) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setUserRole(data?.role || null);

        // If role is required and user doesn't have it, redirect to home
        if (requiredRole && data?.role !== requiredRole) {
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        navigate('/', { replace: true });
      }
    };

    checkUserRole();
  }, [user, requiredRole, navigate]);

  return userRole;
};