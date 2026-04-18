"use client";
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const WishlistContext = createContext({
  wishlist: [],
  wishlistCount: 0,
  addToWishlist: () => {},
  removeFromWishlist: () => {},
  isInWishlist: () => false,
  toggleWishlist: () => {},
  updateDomainInWishlist: () => {},
});

export const useWishlist = () => useContext(WishlistContext);

const STORAGE_KEY = 'agedify_wishlist';

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = useCallback((domain) => {
    setWishlist(prev => {
      if (prev.some(d => d.id === domain.id)) return prev;
      return [...prev, {
        id: domain.id,
        slug: domain.slug,
        domain_name: domain.domain_name,
        dr: domain.dr,
        da: domain.da,
        pa: domain.pa ?? 0,
        backlinks: domain.backlinks,
        traffic: domain.traffic,
        age: domain.age,
        price: domain.price,
        discount_percentage: domain.discount_percentage ?? 0,
        status: domain.status,
        indexed: domain.indexed ?? 0,
        savedPrice: domain.price,
        savedAt: new Date().toISOString(),
      }];
    });
  }, []);

  const removeFromWishlist = useCallback((domainId) => {
    setWishlist(prev => prev.filter(d => d.id !== domainId));
  }, []);

  const isInWishlist = useCallback((domainId) => {
    return wishlist.some(d => d.id === domainId);
  }, [wishlist]);

  const toggleWishlist = useCallback((domain) => {
    if (isInWishlist(domain.id)) {
      removeFromWishlist(domain.id);
    } else {
      addToWishlist(domain);
    }
  }, [isInWishlist, removeFromWishlist, addToWishlist]);

  const updateDomainInWishlist = useCallback((domainId, updatedData) => {
    setWishlist(prev => prev.map(d => {
      if (d.id !== domainId) return d;
      return { ...d, ...updatedData, savedPrice: d.savedPrice, savedAt: d.savedAt };
    }));
  }, []);

  return (
    <WishlistContext.Provider value={{
      wishlist,
      wishlistCount: wishlist.length,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      toggleWishlist,
      updateDomainInWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
};
