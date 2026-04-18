"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrencies } from '../lib/api';

const CurrencyContext = createContext({
  currencies: [],
  selectedCurrency: 'USD',
  changeCurrency: () => {},
  getCurrentCurrency: () => ({ code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 }),
  formatPrice: (p) => `$${p?.toLocaleString?.() || p}`,
  loading: false,
  lastUpdated: null,
});

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }) => {
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      const response = await getCurrencies();
      setCurrencies(response.data.currencies);
      setLastUpdated(response.data.last_updated || null);
      
      // Load saved currency preference
      const saved = localStorage.getItem('preferred_currency');
      if (saved && response.data.currencies.some(c => c.code === saved)) {
        setSelectedCurrency(saved);
      }
    } catch (error) {
      // Default currencies if API fails
      setCurrencies([
        { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
        { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', rate: 15500 },
        { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const changeCurrency = (code) => {
    setSelectedCurrency(code);
    localStorage.setItem('preferred_currency', code);
  };

  const getCurrentCurrency = () => {
    return currencies.find(c => c.code === selectedCurrency) || currencies[0];
  };

  const formatPrice = (priceUSD) => {
    const currency = getCurrentCurrency();
    if (!currency) return `$${priceUSD.toLocaleString()}`;
    
    const convertedPrice = priceUSD * currency.rate;
    
    // Format based on currency
    if (currency.code === 'IDR') {
      return `${currency.symbol}${Math.round(convertedPrice).toLocaleString('id-ID')}`;
    }
    
    return `${currency.symbol}${convertedPrice.toLocaleString(undefined, { 
      minimumFractionDigits: currency.code === 'USD' || currency.code === 'EUR' || currency.code === 'GBP' ? 0 : 0,
      maximumFractionDigits: 0 
    })}`;
  };

  const value = {
    currencies,
    selectedCurrency,
    changeCurrency,
    getCurrentCurrency,
    formatPrice,
    loading,
    lastUpdated,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext;
