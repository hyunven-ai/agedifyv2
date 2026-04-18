"use client";
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Globe, Search, Filter, X, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Scale, CheckCircle, XCircle, SlidersHorizontal, TrendingUp, Heart, Save, FolderOpen, Trash2, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { getPublicDomains, getDomainsCount } from '../lib/api';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import CurrencySelector from '../components/CurrencySelector';
import DomainComparison from '../components/DomainComparison';
import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';

const DomainsPage = () => {
  const { isDark } = useTheme();
  const { formatPrice } = useCurrency();
  const { isInWishlist, toggleWishlist, wishlistCount } = useWishlist();
  const { t } = useLanguage();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [savedFilters, setSavedFilters] = useState([]);
  const [filterName, setFilterName] = useState('');
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const itemsPerPage = 10;

  const [filters, setFilters] = useState({
    search: '',
    minPrice: '',
    maxPrice: '',
    minDr: '',
    maxDr: '',
    minDa: '',
    maxDa: '',
    minPa: '',
    maxPa: '',
    minAge: '',
    maxAge: '',
    minTraffic: '',
    maxTraffic: '',
    minBacklinks: '',
    maxBacklinks: '',
    tld: '',
    language: '',
    status: ''
  });

  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    loadDomains();
  }, [currentPage, filters, sortBy, sortOrder]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = JSON.parse(localStorage.getItem('agedify_saved_filters') || '[]');
        setSavedFilters(saved);
      } catch {}
    }
  }, []);

  const buildQueryParams = () => {
    const params = {
      skip: (currentPage - 1) * itemsPerPage,
      limit: itemsPerPage
    };

    if (filters.search) params.search = filters.search;
    if (filters.minPrice) params.min_price = parseFloat(filters.minPrice);
    if (filters.maxPrice) params.max_price = parseFloat(filters.maxPrice);
    if (filters.minDr) params.min_dr = parseInt(filters.minDr);
    if (filters.maxDr) params.max_dr = parseInt(filters.maxDr);
    if (filters.minDa) params.min_da = parseInt(filters.minDa);
    if (filters.maxDa) params.max_da = parseInt(filters.maxDa);
    if (filters.minPa) params.min_pa = parseInt(filters.minPa);
    if (filters.maxPa) params.max_pa = parseInt(filters.maxPa);
    if (filters.minAge) params.min_age = parseInt(filters.minAge);
    if (filters.maxAge) params.max_age = parseInt(filters.maxAge);
    if (filters.minTraffic) params.min_traffic = parseInt(filters.minTraffic);
    if (filters.maxTraffic) params.max_traffic = parseInt(filters.maxTraffic);
    if (filters.minBacklinks) params.min_backlinks = parseInt(filters.minBacklinks);
    if (filters.maxBacklinks) params.max_backlinks = parseInt(filters.maxBacklinks);
    if (filters.tld) params.tld = filters.tld;
    if (filters.language) params.language = filters.language;
    if (filters.status) params.status = filters.status;
    if (sortBy) {
      params.sort_by = sortBy;
      params.sort_order = sortOrder;
    }

    return params;
  };

  const loadDomains = async () => {
    setLoading(true);
    try {
      const params = buildQueryParams();
      const [domainsRes, countRes] = await Promise.all([
        getPublicDomains(params),
        getDomainsCount(params)
      ]);
      const domainsData = domainsRes?.data ?? domainsRes;
      const countData = countRes?.data ?? countRes;
      setDomains(Array.isArray(domainsData) ? domainsData : []);
      setTotalCount(countData?.count || 0);
    } catch (error) {
      console.error('Error loading domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '', minPrice: '', maxPrice: '', minDr: '', maxDr: '',
      minDa: '', maxDa: '', minPa: '', maxPa: '', minAge: '', maxAge: '',
      minTraffic: '', maxTraffic: '', minBacklinks: '', maxBacklinks: '',
      tld: '', language: '', status: ''
    });
    setSortBy('');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '') || sortBy !== '';

  const saveCurrentFilter = () => {
    if (!filterName.trim()) return;
    const newFilter = { name: filterName.trim(), filters: { ...filters }, sortBy, sortOrder, id: Date.now() };
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('agedify_saved_filters', JSON.stringify(updated));
    setFilterName('');
    setShowSavedFilters(false);
  };

  const loadSavedFilter = (saved) => {
    setFilters(saved.filters);
    setSortBy(saved.sortBy || '');
    setSortOrder(saved.sortOrder || 'asc');
    setCurrentPage(1);
    setShowSavedFilters(false);
  };

  const deleteSavedFilter = (id) => {
    const updated = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updated);
    localStorage.setItem('agedify_saved_filters', JSON.stringify(updated));
  };

  const applyPreset = (preset) => {
    const presets = {
      'high-authority': { minDr: '50', minDa: '40', status: 'available' },
      'budget': { maxPrice: '500', status: 'available' },
      'premium': { minDr: '70', minPrice: '1000', status: 'available' },
      'low-spam': { maxPrice: '', status: 'available' },
    };
    clearFilters();
    const p = presets[preset];
    if (p) {
      setFilters(prev => ({ ...prev, ...p }));
      setCurrentPage(1);
    }
  };
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  const toggleCompare = (domain) => {
    if (isInCompareList(domain.id)) {
      setCompareList(prev => prev.filter(d => d.id !== domain.id));
    } else if (compareList.length < 4) {
      setCompareList(prev => [...prev, domain]);
    }
  };

  const isInCompareList = (id) => compareList.some(d => d.id === id);
  const removeFromCompare = (id) => setCompareList(prev => prev.filter(d => d.id !== id));

  // Filter sidebar content (shared between desktop and mobile)
  const FilterContent = ({ isMobile = false }) => (
    <div className="space-y-5">
      {/* Quick Presets */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Quick Presets</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'high-authority', label: 'High Authority', icon: TrendingUp },
            { id: 'budget', label: 'Budget', icon: Zap },
            { id: 'premium', label: 'Premium', icon: Scale },
            { id: 'low-spam', label: 'Available', icon: CheckCircle },
          ].map(p => (
            <button key={p.id} onClick={() => applyPreset(p.id)}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all duration-200 ${isDark ? 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-600'}`}
              data-testid={`preset-${p.id}`}
            >
              <p.icon className="w-3 h-3" /> {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Saved Filters */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={`block text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Saved Filters</label>
          <button onClick={() => setShowSavedFilters(!showSavedFilters)}
            className="text-xs text-violet-500 hover:text-violet-400 font-semibold"
            data-testid="toggle-saved-filters"
          >{showSavedFilters ? 'Hide' : `Show (${savedFilters.length})`}</button>
        </div>
        {showSavedFilters && (
          <div className="space-y-2">
            {savedFilters.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No saved filters yet</p>
            ) : (
              savedFilters.map(sf => (
                <div key={sf.id} className={`flex items-center justify-between py-2 px-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <button onClick={() => loadSavedFilter(sf)} className="text-sm font-medium text-foreground hover:text-violet-500 truncate flex-1 text-left" data-testid={`load-filter-${sf.id}`}>
                    <FolderOpen className="w-3 h-3 inline mr-1.5" />{sf.name}
                  </button>
                  <button onClick={() => deleteSavedFilter(sf.id)} className="text-red-400 hover:text-red-500 ml-2" data-testid={`delete-filter-${sf.id}`}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
            {hasActiveFilters && (
              <div className="flex gap-2 mt-2">
                <input
                  placeholder="Filter name..."
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveCurrentFilter()}
                  className={`flex-1 h-8 px-3 text-xs rounded-lg border ${isDark ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-white'} focus:outline-none focus:ring-1 focus:ring-violet-500`}
                  data-testid="filter-name-input"
                />
                <button onClick={saveCurrentFilter}
                  className="px-3 h-8 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 transition-colors flex items-center gap-1"
                  data-testid="save-filter-btn"
                >
                  <Save className="w-3 h-3" /> Save
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sort By */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sort By</label>
        <select
          data-testid="sort-select"
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
          className={`w-full h-10 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
            isDark
              ? 'border-white/10 bg-slate-800 text-white focus:ring-violet-500/30 focus:border-violet-500/50 [&>option]:bg-slate-800 [&>option]:text-white'
              : 'border-slate-200 bg-white text-slate-700 focus:ring-violet-500/20 focus:border-violet-400'
          }`}
        >
          <option value="">Default</option>
          <option value="domain_name">Domain Name (A-Z)</option>
          <option value="dr">DR</option>
          <option value="da">DA</option>
          <option value="pa">PA</option>
          <option value="spam_score">Spam Score</option>
          <option value="price">Price</option>
          <option value="age">Age</option>
          <option value="backlinks">Backlinks</option>
          <option value="traffic">Traffic</option>
        </select>
        {sortBy && (
          <div className="flex gap-2 mt-2">
            <button
              data-testid="sort-asc-btn"
              onClick={() => setSortOrder('asc')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                sortOrder === 'asc'
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-500/25'
                  : (isDark ? 'bg-white/5 text-muted-foreground hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
              }`}
            >
              <ArrowUp className="w-4 h-4 mx-auto" />
            </button>
            <button
              data-testid="sort-desc-btn"
              onClick={() => setSortOrder('desc')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                sortOrder === 'desc'
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-500/25'
                  : (isDark ? 'bg-white/5 text-muted-foreground hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
              }`}
            >
              <ArrowDown className="w-4 h-4 mx-auto" />
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Search Domain</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="search-input"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className={`pl-10 h-10 rounded-xl border transition-all duration-200 ${isDark ? 'border-white/10 bg-white/5 focus:border-violet-500/50' : 'border-slate-200 focus:border-violet-400'}`}
          />
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Price Range ($)</label>
        <div className="flex gap-2">
          <Input data-testid="min-price-input" type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            className={`h-10 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200'}`} />
          <Input data-testid="max-price-input" type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            className={`h-10 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200'}`} />
        </div>
      </div>

      {/* DR Range */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>DR Range</label>
        <div className="flex gap-2">
          <Input data-testid="min-dr-input" type="number" placeholder="Min" min="0" max="100" value={filters.minDr} onChange={(e) => handleFilterChange('minDr', e.target.value)}
            className={`h-10 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200'}`} />
          <Input data-testid="max-dr-input" type="number" placeholder="Max" min="0" max="100" value={filters.maxDr} onChange={(e) => handleFilterChange('maxDr', e.target.value)}
            className={`h-10 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200'}`} />
        </div>
      </div>

      {/* DA Range */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>DA Range</label>
        <div className="flex gap-2">
          <Input data-testid="min-da-input" type="number" placeholder="Min" min="0" max="100" value={filters.minDa} onChange={(e) => handleFilterChange('minDa', e.target.value)}
            className={`h-10 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200'}`} />
          <Input data-testid="max-da-input" type="number" placeholder="Max" min="0" max="100" value={filters.maxDa} onChange={(e) => handleFilterChange('maxDa', e.target.value)}
            className={`h-10 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200'}`} />
        </div>
      </div>

      {/* PA Range */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>PA Range</label>
        <div className="flex gap-2">
          <Input data-testid="min-pa-input" type="number" placeholder="Min" min="0" max="100" value={filters.minPa} onChange={(e) => handleFilterChange('minPa', e.target.value)}
            className={`h-10 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200'}`} />
          <Input data-testid="max-pa-input" type="number" placeholder="Max" min="0" max="100" value={filters.maxPa} onChange={(e) => handleFilterChange('maxPa', e.target.value)}
            className={`h-10 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200'}`} />
        </div>
      </div>

      {/* Traffic Range */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Traffic</label>
        <div className="flex gap-2">
          <Input data-testid="min-traffic-input" type="number" placeholder="Min" value={filters.minTraffic} onChange={(e) => handleFilterChange('minTraffic', e.target.value)}
            className={`h-10 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200'}`} />
          <Input data-testid="max-traffic-input" type="number" placeholder="Max" value={filters.maxTraffic} onChange={(e) => handleFilterChange('maxTraffic', e.target.value)}
            className={`h-10 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200'}`} />
        </div>
      </div>

      {/* Backlinks Range */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Backlinks</label>
        <div className="flex gap-2">
          <Input data-testid="min-backlinks-input" type="number" placeholder="Min" value={filters.minBacklinks} onChange={(e) => handleFilterChange('minBacklinks', e.target.value)}
            className={`h-10 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200'}`} />
          <Input data-testid="max-backlinks-input" type="number" placeholder="Max" value={filters.maxBacklinks} onChange={(e) => handleFilterChange('maxBacklinks', e.target.value)}
            className={`h-10 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200'}`} />
        </div>
      </div>

      {/* Age Range */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Age (Years)</label>
        <div className="flex gap-2">
          <Input data-testid="min-age-input" type="number" placeholder="Min" value={filters.minAge} onChange={(e) => handleFilterChange('minAge', e.target.value)}
            className={`h-10 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200'}`} />
          <Input data-testid="max-age-input" type="number" placeholder="Max" value={filters.maxAge} onChange={(e) => handleFilterChange('maxAge', e.target.value)}
            className={`h-10 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200'}`} />
        </div>
      </div>

      {/* TLD */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>TLD</label>
        <select
          data-testid="tld-select"
          value={filters.tld}
          onChange={(e) => handleFilterChange('tld', e.target.value)}
          className={`w-full h-10 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
            isDark ? 'border-white/10 bg-slate-800 text-white focus:ring-violet-500/30 [&>option]:bg-slate-800 [&>option]:text-white' : 'border-slate-200 bg-white text-slate-700 focus:ring-violet-500/20'
          }`}
        >
          <option value="">All TLDs</option>
          <option value=".com">.com</option>
          <option value=".net">.net</option>
          <option value=".org">.org</option>
          <option value=".io">.io</option>
          <option value=".co">.co</option>
          <option value=".id">.id</option>
          <option value=".co.id">.co.id</option>
        </select>
      </div>

      {/* Language */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Language</label>
        <select
          data-testid="language-select"
          value={filters.language}
          onChange={(e) => handleFilterChange('language', e.target.value)}
          className={`w-full h-10 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
            isDark ? 'border-white/10 bg-slate-800 text-white focus:ring-violet-500/30 [&>option]:bg-slate-800 [&>option]:text-white' : 'border-slate-200 bg-white text-slate-700 focus:ring-violet-500/20'
          }`}
        >
          <option value="">All Languages</option>
          <option value="English">English</option>
          <option value="Indonesian">Indonesian</option>
          <option value="Spanish">Spanish</option>
          <option value="Chinese">Chinese</option>
          <option value="Japanese">Japanese</option>
        </select>
      </div>

      {/* Status */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</label>
        <div className="flex gap-2">
          <button data-testid="status-all-btn" onClick={() => handleFilterChange('status', '')}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              filters.status === '' ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-500/25' : (isDark ? 'bg-white/5 text-muted-foreground hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
            }`}
          >All</button>
          <button data-testid="status-available-btn" onClick={() => handleFilterChange('status', 'available')}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              filters.status === 'available' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25' : (isDark ? 'bg-white/5 text-muted-foreground hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
            }`}
          >Available</button>
          <button data-testid="status-sold-btn" onClick={() => handleFilterChange('status', 'sold')}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              filters.status === 'sold' ? 'bg-slate-600 text-white shadow-md' : (isDark ? 'bg-white/5 text-muted-foreground hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
            }`}
          >Sold</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-4">
            <Link href="/" className="flex items-center" data-testid="logo">
              <Image src="/logo-agedify.png" alt="Agedify" width={224} height={56} priority className="h-14 w-auto" />
            </Link>
            <div className="hidden md:flex items-center space-x-2">
              <Link href="/" className="px-4 py-2 text-base text-muted-foreground hover:text-foreground transition-all duration-200 rounded-lg hover:bg-accent/10 font-semibold">Home</Link>
              <Link href="/domains" className="px-4 py-2 text-base text-foreground font-semibold rounded-lg bg-accent/10">Domains</Link>
              <Link href="/blog" className="px-4 py-2 text-base text-muted-foreground hover:text-foreground transition-all duration-200 rounded-lg hover:bg-accent/10 font-semibold">Blog</Link>
              <a href="/#contact" className="px-4 py-2 text-base text-muted-foreground hover:text-foreground transition-all duration-200 rounded-lg hover:bg-accent/10 font-semibold">Contact</a>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/wishlist" className="relative p-2 rounded-xl hover:bg-accent/10 transition-all duration-200" data-testid="wishlist-nav-icon">
                <Heart className={`w-5 h-5 transition-colors ${wishlistCount > 0 ? 'text-rose-500 fill-rose-500' : 'text-muted-foreground'}`} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <CurrencySelector />
              <LanguageToggle />
              <ThemeToggle />
            </div>
            <div className="md:hidden flex items-center gap-2">
              <Link href="/wishlist" className="relative p-2 rounded-xl" data-testid="wishlist-nav-icon-mobile">
                <Heart className={`w-5 h-5 ${wishlistCount > 0 ? 'text-rose-500 fill-rose-500' : 'text-muted-foreground'}`} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <CurrencySelector />
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Compare Bar */}
      {compareList.length > 0 && (
        <div className={`fixed bottom-0 left-0 right-0 z-50 ${isDark ? 'bg-card/95' : 'bg-white/95'} backdrop-blur-xl border-t border-border shadow-2xl p-4`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <Scale className="w-5 h-5 text-violet-500" />
              <span className="font-semibold text-foreground">Compare ({compareList.length}/4):</span>
              {compareList.map((d) => (
                <span key={d.id} className={`${isDark ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' : 'bg-violet-50 text-violet-700 border-violet-200'} border px-3 py-1 rounded-full text-sm flex items-center gap-2`}>
                  {d.domain_name}
                  <button onClick={() => removeFromCompare(d.id)} className="hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCompareList([])} className="rounded-full">Clear All</Button>
              <Button size="sm" onClick={() => setShowComparison(true)}
                className="btn-gradient text-white rounded-full shadow-lg shadow-violet-500/25"
                disabled={compareList.length < 2}
              >Compare Now</Button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showComparison && (
        <DomainComparison domains={compareList} onRemove={removeFromCompare} onClose={() => setShowComparison(false)} />
      )}

      {/* Hero Header */}
      <section className="relative pt-28 pb-12 overflow-hidden">
        <div className="absolute inset-0 hero-pattern"></div>
        <div className={`absolute top-10 right-20 w-64 h-64 ${isDark ? 'bg-violet-500/15' : 'bg-violet-500/10'} rounded-full blur-3xl animate-float`}></div>
        <div className={`absolute bottom-0 left-10 w-80 h-80 ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-500/8'} rounded-full blur-3xl animate-float`} style={{animationDelay: '2s'}}></div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <span className={`inline-flex items-center gap-2 px-4 py-1.5 ${isDark ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-violet-50 text-violet-600 border border-violet-200'} rounded-full text-sm font-semibold mb-4`}>
                <Globe className="w-4 h-4" />
                Domain Marketplace
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-3" data-testid="domains-title">
                {t('domains.title')} <span className="gradient-text">{t('domains.titleHighlight')}</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                {t('domains.subtitle')}
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Domains', value: totalCount, icon: Globe },
              { label: 'Available', value: Array.isArray(domains) ? domains.filter(d => d.status === 'available').length : 0, icon: CheckCircle },
              { label: 'Avg DR', value: Array.isArray(domains) && domains.length ? Math.round(domains.reduce((a, d) => a + d.dr, 0) / domains.length) : 0, icon: TrendingUp },
              { label: 'On Sale', value: Array.isArray(domains) ? domains.filter(d => (d.discount_percentage ?? 0) > 0).length : 0, icon: Scale },
            ].map((stat, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
                isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-slate-200/60 shadow-sm'
              }`} data-testid={`stat-${i}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-violet-500/20' : 'bg-violet-50'}`}>
                  <stat.icon className={`w-5 h-5 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar - Desktop */}
            <div className="hidden lg:block w-72 flex-shrink-0">
              <div className={`rounded-2xl p-6 sticky top-24 backdrop-blur-xl border transition-all duration-300 ${
                isDark
                  ? 'bg-white/[0.03] border-white/10 shadow-xl shadow-black/10'
                  : 'bg-white/90 border-slate-200/60 shadow-xl shadow-slate-200/30'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className={`w-4 h-4 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
                    <h3 className="font-bold text-foreground">Filters</h3>
                  </div>
                  {hasActiveFilters && (
                    <button onClick={clearFilters}
                      className="text-xs font-semibold text-violet-500 hover:text-violet-400 transition-colors"
                      data-testid="clear-filters-btn"
                    >Clear all</button>
                  )}
                </div>
                <FilterContent />
              </div>
            </div>

            {/* Mobile Filter Button */}
            <div className="lg:hidden">
              <Button
                onClick={() => setShowFilters(true)}
                variant="outline"
                className={`w-full rounded-2xl border-2 h-12 font-semibold ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'}`}
                data-testid="mobile-filter-btn"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 w-5 h-5 bg-violet-600 text-white rounded-full text-xs flex items-center justify-center">
                    {Object.values(filters).filter(v => v !== '').length}
                  </span>
                )}
              </Button>
            </div>

            {/* Mobile Filters Modal */}
            {showFilters && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFilters(false)}></div>
                <div className={`absolute right-0 top-0 bottom-0 w-full max-w-sm p-6 overflow-y-auto animate-slide-in-right ${isDark ? 'bg-[#0F172A]' : 'bg-white'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-5 h-5 text-violet-500" />
                      <h3 className="text-lg font-bold text-foreground">Filters</h3>
                    </div>
                    <button onClick={() => setShowFilters(false)} data-testid="close-filters-btn"
                      className={`p-2 rounded-xl ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <FilterContent isMobile />
                  <div className="mt-8 flex gap-3">
                    <Button onClick={clearFilters} variant="outline" className="flex-1 rounded-xl h-11">Clear All</Button>
                    <Button onClick={() => setShowFilters(false)} className="flex-1 btn-gradient text-white rounded-xl h-11">Apply Filters</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Domain List */}
            <div className="flex-1">
              {/* Results Count */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  Showing <span className="font-bold text-foreground">{domains.length}</span> of{' '}
                  <span className="font-bold text-foreground">{totalCount}</span> domains
                </p>
              </div>

              {/* Domain Table */}
              <div className={`rounded-2xl overflow-hidden backdrop-blur-xl border transition-all duration-300 ${
                isDark
                  ? 'bg-white/[0.03] border-white/10 shadow-xl shadow-black/10'
                  : 'bg-white/90 border-slate-200/60 shadow-xl shadow-slate-200/30'
              }`}>
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="domains-table">
                    <thead>
                      <tr className={`border-b ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/60'}`}>
                        <th className="text-left py-4 px-6">
                          <button onClick={() => handleSort('domain_name')} className="flex items-center gap-2 font-semibold text-muted-foreground hover:text-foreground transition-colors text-sm" data-testid="sort-domain-btn">
                            Domain <SortIcon field="domain_name" />
                          </button>
                        </th>
                        <th className="text-center py-4 px-3">
                          <button onClick={() => handleSort('dr')} className="flex items-center justify-center gap-1 font-semibold text-muted-foreground hover:text-foreground transition-colors mx-auto text-sm" data-testid="sort-dr-btn">
                            DR <SortIcon field="dr" />
                          </button>
                        </th>
                        <th className="text-center py-4 px-3">
                          <button onClick={() => handleSort('da')} className="flex items-center justify-center gap-1 font-semibold text-muted-foreground hover:text-foreground transition-colors mx-auto text-sm" data-testid="sort-da-btn">
                            DA <SortIcon field="da" />
                          </button>
                        </th>
                        <th className="text-center py-4 px-3 hidden sm:table-cell">
                          <button onClick={() => handleSort('pa')} className="flex items-center justify-center gap-1 font-semibold text-muted-foreground hover:text-foreground transition-colors mx-auto text-sm" data-testid="sort-pa-btn">
                            PA <SortIcon field="pa" />
                          </button>
                        </th>
                        <th className="text-center py-4 px-3 hidden sm:table-cell">
                          <button onClick={() => handleSort('spam_score')} className="flex items-center justify-center gap-1 font-semibold text-muted-foreground hover:text-foreground transition-colors mx-auto text-sm" data-testid="sort-ss-btn">
                            SS <SortIcon field="spam_score" />
                          </button>
                        </th>
                        <th className="text-center py-4 px-3 hidden md:table-cell">
                          <button onClick={() => handleSort('backlinks')} className="flex items-center justify-center gap-1 font-semibold text-muted-foreground hover:text-foreground transition-colors mx-auto text-sm" data-testid="sort-backlinks-btn">
                            Backlinks <SortIcon field="backlinks" />
                          </button>
                        </th>
                        <th className="text-center py-4 px-3 hidden md:table-cell">
                          <span className="font-semibold text-muted-foreground text-sm">Indexed</span>
                        </th>
                        <th className="text-center py-4 px-3 hidden lg:table-cell">
                          <button onClick={() => handleSort('age')} className="flex items-center justify-center gap-1 font-semibold text-muted-foreground hover:text-foreground transition-colors mx-auto text-sm" data-testid="sort-age-btn">
                            Age <SortIcon field="age" />
                          </button>
                        </th>
                        <th className="text-right py-4 px-4">
                          <button onClick={() => handleSort('price')} className="flex items-center justify-end gap-1 font-semibold text-muted-foreground hover:text-foreground transition-colors ml-auto text-sm" data-testid="sort-price-btn">
                            Price <SortIcon field="price" />
                          </button>
                        </th>
                        <th className="text-center py-4 px-3 font-semibold text-muted-foreground text-sm">Status</th>
                        <th className="text-center py-4 px-4 font-semibold text-muted-foreground text-sm">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="12" className="text-center py-16">
                            <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent mx-auto"></div>
                          </td>
                        </tr>
                      ) : domains.length === 0 ? (
                        <tr>
                          <td colSpan="12" className="text-center py-16 text-muted-foreground">
                            <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            No domains found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        domains.map((domain, index) => (
                          <tr key={domain.id}
                            className={`border-b transition-all duration-200 group ${
                              isDark
                                ? 'border-white/5 hover:bg-white/[0.03]'
                                : 'border-slate-100 hover:bg-violet-50/30'
                            }`}
                            data-testid={`domain-row-${index}`}
                          >
                            <td className="py-4 px-6">
                              <Link href={`/domain/${domain.slug}`} className="font-semibold text-foreground hover:text-violet-500 transition-colors duration-200">
                                {domain.domain_name}
                              </Link>
                            </td>
                            <td className="text-center py-4 px-3">
                              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm transition-transform duration-200 group-hover:scale-105 ${isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'}`}>
                                {domain.dr}
                              </span>
                            </td>
                            <td className="text-center py-4 px-3">
                              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm transition-transform duration-200 group-hover:scale-105 ${isDark ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200/50'}`}>
                                {domain.da}
                              </span>
                            </td>
                            <td className="text-center py-4 px-3 hidden sm:table-cell">
                              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm transition-transform duration-200 group-hover:scale-105 ${isDark ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20' : 'bg-violet-50 text-violet-700 border border-violet-200/50'}`}>
                                {domain.pa ?? 0}
                              </span>
                            </td>
                            <td className="text-center py-4 px-3 hidden sm:table-cell">
                              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm transition-transform duration-200 group-hover:scale-105 ${
                                (domain.spam_score ?? 0) <= 3
                                  ? (isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/50')
                                  : (domain.spam_score ?? 0) <= 7
                                    ? (isDark ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200/50')
                                    : (isDark ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-700 border border-red-200/50')
                              }`}>
                                {domain.spam_score ?? '-'}
                              </span>
                            </td>
                            <td className="text-center py-4 px-3 text-muted-foreground font-medium hidden md:table-cell">{domain.backlinks?.toLocaleString()}</td>
                            <td className="text-center py-4 px-3 hidden md:table-cell">
                              {(domain.indexed ?? 0) > 0 ? (
                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}><CheckCircle className="w-4 h-4" /></span>
                              ) : (
                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-500'}`}><XCircle className="w-4 h-4" /></span>
                              )}
                            </td>
                            <td className="text-center py-4 px-3 text-muted-foreground font-medium hidden lg:table-cell">{domain.age} yrs</td>
                            <td className="text-right py-4 px-4">
                              {(domain.discount_percentage ?? 0) > 0 ? (
                                <div>
                                  <span className="text-xs text-muted-foreground line-through block">{formatPrice(domain.price || 0)}</span>
                                  <span className="font-bold text-foreground">{formatPrice(domain.price * (1 - domain.discount_percentage / 100))}</span>
                                  <span className={`ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>-{domain.discount_percentage}%</span>
                                </div>
                              ) : (
                                <span className="font-bold text-foreground">{formatPrice(domain.price || 0)}</span>
                              )}
                            </td>
                            <td className="text-center py-4 px-3">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                domain.status === 'available' ? 'status-available' : 'status-sold'
                              }`}>
                                {domain.status === 'available' ? 'Available' : 'Sold'}
                              </span>
                            </td>
                            <td className="text-center py-4 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={(e) => { e.preventDefault(); toggleWishlist(domain); }}
                                  className={`p-2 rounded-xl transition-all duration-200 ${
                                    isInWishlist(domain.id)
                                      ? 'text-rose-500'
                                      : (isDark ? 'hover:bg-white/10 text-muted-foreground hover:text-rose-400' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-500')
                                  }`}
                                  title={isInWishlist(domain.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                                  data-testid={`wishlist-btn-${domain.id}`}
                                >
                                  <Heart className={`w-4 h-4 ${isInWishlist(domain.id) ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                  onClick={(e) => { e.preventDefault(); toggleCompare(domain); }}
                                  className={`p-2 rounded-xl transition-all duration-200 ${
                                    isInCompareList(domain.id)
                                      ? (isDark ? 'bg-violet-500/20 text-violet-400 shadow-sm shadow-violet-500/10' : 'bg-violet-100 text-violet-600')
                                      : (isDark ? 'hover:bg-white/10 text-muted-foreground' : 'hover:bg-slate-100 text-slate-400')
                                  }`}
                                  title={isInCompareList(domain.id) ? 'Remove from compare' : 'Add to compare'}
                                  data-testid={`compare-btn-${domain.id}`}
                                >
                                  <Scale className="w-4 h-4" />
                                </button>
                                <Link href={`/domain/${domain.slug}`}>
                                  <Button size="sm" className="btn-gradient text-white rounded-full px-5 shadow-md shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-200">
                                    View
                                  </Button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8" data-testid="pagination">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`rounded-xl h-10 w-10 ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200'}`}
                    data-testid="prev-page-btn"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`rounded-xl h-10 w-10 transition-all duration-200 ${
                          currentPage === pageNum
                            ? 'btn-gradient text-white shadow-md shadow-violet-500/25'
                            : (isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50')
                        }`}
                        data-testid={`page-${pageNum}-btn`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`rounded-xl h-10 w-10 ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200'}`}
                    data-testid="next-page-btn"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DomainsPage;
