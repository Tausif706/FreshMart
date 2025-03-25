import { useState, useEffect } from 'react';

interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

export const useRateLimiter = ({ maxRequests, windowMs }: RateLimiterOptions) => {
  const [requests, setRequests] = useState<number[]>([]);

  const isRateLimited = () => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Remove old requests outside the current window
    const currentRequests = requests.filter(timestamp => timestamp > windowStart);
    setRequests(currentRequests);

    // Check if we've exceeded the rate limit
    return currentRequests.length >= maxRequests;
  };

  const addRequest = () => {
    if (!isRateLimited()) {
      setRequests([...requests, Date.now()]);
      return true;
    }
    return false;
  };

  // Clean up old requests periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      const windowStart = now - windowMs;
      setRequests(prev => prev.filter(timestamp => timestamp > windowStart));
    }, windowMs);

    return () => clearInterval(cleanup);
  }, [windowMs]);

  return { isRateLimited, addRequest };
};