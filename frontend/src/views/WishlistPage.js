"use client";
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Globe, Trash2, ArrowRight, CheckCircle, XCircle, TrendingDown, TrendingUp, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import CurrencySelector from '../components/CurrencySelector';
import ThemeToggle from '../components/ThemeToggle';
import { getPublicDomains } from '../lib/api';

const WishlistPage = () => {
  const { isDark } = useTheme();
  const { formatPrice } = useCurrency();
  const { wishlist, removeFromWishlist, updateDomainInWishlist } = useWishlist();
  const { t } = useLanguage();
  const [livePrices, setLivePrices] = useState({});

  useEffect(() => {
    if (wishlist.length === 0) return;
    const fetchLivePrices = async () => {
      try {
        const res = await getPublicDomains({ limit: 100 });
        const data = res?.data ?? res;
        if (Array.isArray(data)) {
          const priceMap = {};
          data.forEach(d => {
            priceMap[d.id] = { price: d.price, status: d.status, discount_percentage: d.discount_percentage ?? 0 };
          });
          setLivePrices(priceMap);
          data.forEach(d => {
            if (wishlist.some(w => w.id === d.id)) {
              updateDomainInWishlist(d.id, { price: d.price, status: d.status, discount_percentage: d.discount_percentage ?? 0 });
            }
          });
        }
      } catch (err) {
        console.error('Error fetching live prices:', err);
      }
    };
    fetchLivePrices();
  }, []);

  const getPriceChange = (item) => {
    const live = livePrices[item.id];
    if (!live) return null;
    const savedEffective = item.savedPrice;
    const currentEffective = live.price;
    if (currentEffective < savedEffective) return { type: 'down', diff: savedEffective - currentEffective };
    if (currentEffective > savedEffective) return { type: 'up', diff: currentEffective - savedEffective };
    return null;
  };

  const formatSavedDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

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
              <Link href="/domains" className="px-4 py-2 text-base text-muted-foreground hover:text-foreground transition-all duration-200 rounded-lg hover:bg-accent/10 font-semibold">Domains</Link>
              <Link href="/blog" className="px-4 py-2 text-base text-muted-foreground hover:text-foreground transition-all duration-200 rounded-lg hover:bg-accent/10 font-semibold">Blog</Link>
              <a href="/#contact" className="px-4 py-2 text-base text-muted-foreground hover:text-foreground transition-all duration-200 rounded-lg hover:bg-accent/10 font-semibold">Contact</a>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/wishlist" className="relative p-2 rounded-xl text-rose-500" data-testid="wishlist-nav-icon">
                <Heart className="w-5 h-5 fill-current" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlist.length}
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

      {/* Hero Header */}
      <section className="relative pt-28 pb-12 overflow-hidden">
        <div className="absolute inset-0 hero-pattern"></div>
        <div className={`absolute top-10 right-20 w-64 h-64 ${isDark ? 'bg-rose-500/15' : 'bg-rose-500/10'} rounded-full blur-3xl animate-float`}></div>
        <div className={`absolute bottom-0 left-10 w-80 h-80 ${isDark ? 'bg-violet-500/10' : 'bg-violet-500/8'} rounded-full blur-3xl animate-float`} style={{ animationDelay: '2s' }}></div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <span className={`inline-flex items-center gap-2 px-4 py-1.5 ${isDark ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-rose-50 text-rose-600 border border-rose-200'} rounded-full text-sm font-semibold mb-4`}>
            <Heart className="w-4 h-4 fill-current" />
            {t('wishlistPage.badge')}
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-3" data-testid="wishlist-title">
            {t('wishlistPage.title')} <span className="gradient-text">{t('wishlistPage.titleHighlight')}</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            {wishlist.length === 0
              ? t('wishlistPage.emptySubtitle')
              : t('wishlistPage.subtitle').replace('{count}', wishlist.length).replace('{s}', wishlist.length > 1 ? 's' : '')}
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {wishlist.length === 0 ? (
            <div className={`rounded-2xl backdrop-blur-xl border p-16 text-center ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white/90 border-slate-200/60'}`}>
              <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h2 className="text-2xl font-bold text-foreground mb-3">{t('wishlistPage.emptyTitle')}</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                {t('wishlistPage.emptyDesc')}
              </p>
              <Link href="/domains">
                <Button className="btn-gradient text-white rounded-full px-8 py-5 font-semibold shadow-lg shadow-violet-500/25" data-testid="browse-domains-btn">
                  {t('wishlistPage.browseDomains')} <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className={`rounded-2xl overflow-hidden backdrop-blur-xl border transition-all duration-300 ${isDark ? 'bg-white/[0.03] border-white/10 shadow-xl shadow-black/10' : 'bg-white/90 border-slate-200/60 shadow-xl shadow-slate-200/30'}`}>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="wishlist-table">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/60'}`}>
                      <th className="text-left py-4 px-6 font-semibold text-muted-foreground text-sm">Domain</th>
                      <th className="text-center py-4 px-3 font-semibold text-muted-foreground text-sm">DR</th>
                      <th className="text-center py-4 px-3 font-semibold text-muted-foreground text-sm">DA</th>
                      <th className="text-center py-4 px-3 font-semibold text-muted-foreground text-sm hidden sm:table-cell">PA</th>
                      <th className="text-center py-4 px-3 font-semibold text-muted-foreground text-sm hidden md:table-cell">Indexed</th>
                      <th className="text-center py-4 px-3 font-semibold text-muted-foreground text-sm hidden lg:table-cell">Age</th>
                      <th className="text-right py-4 px-4 font-semibold text-muted-foreground text-sm">Price</th>
                      <th className="text-center py-4 px-3 font-semibold text-muted-foreground text-sm hidden sm:table-cell">Saved</th>
                      <th className="text-center py-4 px-3 font-semibold text-muted-foreground text-sm">Status</th>
                      <th className="text-center py-4 px-4 font-semibold text-muted-foreground text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wishlist.map((item, index) => {
                      const priceChange = getPriceChange(item);
                      return (
                        <tr key={item.id}
                          className={`border-b transition-all duration-200 group ${isDark ? 'border-white/5 hover:bg-white/[0.03]' : 'border-slate-100 hover:bg-violet-50/30'}`}
                          data-testid={`wishlist-row-${index}`}
                        >
                          <td className="py-4 px-6">
                            <Link href={`/domain/${item.slug}`} className="font-semibold text-foreground hover:text-violet-500 transition-colors duration-200">
                              {item.domain_name}
                            </Link>
                          </td>
                          <td className="text-center py-4 px-3">
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm ${isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'}`}>
                              {item.dr}
                            </span>
                          </td>
                          <td className="text-center py-4 px-3">
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm ${isDark ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200/50'}`}>
                              {item.da}
                            </span>
                          </td>
                          <td className="text-center py-4 px-3 hidden sm:table-cell">
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm ${isDark ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20' : 'bg-violet-50 text-violet-700 border border-violet-200/50'}`}>
                              {item.pa}
                            </span>
                          </td>
                          <td className="text-center py-4 px-3 hidden md:table-cell">
                            {(item.indexed ?? 0) > 0 ? (
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}><CheckCircle className="w-4 h-4" /></span>
                            ) : (
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-500'}`}><XCircle className="w-4 h-4" /></span>
                            )}
                          </td>
                          <td className="text-center py-4 px-3 text-muted-foreground font-medium hidden lg:table-cell">{item.age} yrs</td>
                          <td className="text-right py-4 px-4">
                            <div>
                              {(item.discount_percentage ?? 0) > 0 ? (
                                <>
                                  <span className="text-xs text-muted-foreground line-through block">{formatPrice(item.price || 0)}</span>
                                  <span className="font-bold text-foreground">{formatPrice(item.price * (1 - item.discount_percentage / 100))}</span>
                                </>
                              ) : (
                                <span className="font-bold text-foreground">{formatPrice(item.price || 0)}</span>
                              )}
                              {priceChange && (
                                <div className={`flex items-center justify-end gap-1 text-xs mt-1 ${priceChange.type === 'down' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {priceChange.type === 'down' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                                  <span>{priceChange.type === 'down' ? '-' : '+'}{formatPrice(priceChange.diff)}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="text-center py-4 px-3 hidden sm:table-cell">
                            <span className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatSavedDate(item.savedAt)}
                            </span>
                          </td>
                          <td className="text-center py-4 px-3">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'available' ? 'status-available' : 'status-sold'}`}>
                              {item.status === 'available' ? 'Available' : 'Sold'}
                            </span>
                          </td>
                          <td className="text-center py-4 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => removeFromWishlist(item.id)}
                                className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300' : 'hover:bg-red-50 text-red-400 hover:text-red-500'}`}
                                title="Remove from wishlist"
                                data-testid={`remove-wishlist-${index}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <Link href={`/domain/${item.slug}`}>
                                <Button size="sm" className="btn-gradient text-white rounded-full px-5 shadow-md shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-200">
                                  View
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
