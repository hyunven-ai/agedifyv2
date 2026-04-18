"use client";
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Globe, ArrowLeft, TrendingUp, Link2, Clock, Eye, Mail, ShieldAlert, FileSearch, Award, CheckCircle, Heart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { getDomainBySlug, trackDomainView, trackDomainClick } from '../lib/api';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import CurrencySelector from '../components/CurrencySelector';
import ScrollReveal from '../components/ScrollReveal';
import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';

const DomainDetailPage = () => {
  const { slug } = useParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const { formatPrice } = useCurrency();
  const { isInWishlist, toggleWishlist, wishlistCount } = useWishlist();
  const { t } = useLanguage();
  const [domain, setDomain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDomain();
  }, [slug]);

  const loadDomain = async () => {
    try {
      const response = await getDomainBySlug(slug);
      setDomain(response.data);
      trackDomainView(slug);
    } catch (err) {
      setError('Domain not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-violet-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !domain) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Globe className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h2 className="text-2xl font-bold text-foreground mb-4">Domain Not Found</h2>
          <p className="text-muted-foreground mb-6">The domain you're looking for doesn't exist.</p>
          <Link href="/domains">
            <Button className="btn-gradient text-white rounded-full px-8">Back to Domains</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getSpamScoreColor = (score) => {
    if (score <= 5) return { bg: isDark ? 'bg-emerald-500/15' : 'bg-emerald-50', text: isDark ? 'text-emerald-400' : 'text-emerald-600', border: isDark ? 'border-emerald-500/20' : 'border-emerald-200/50' };
    if (score <= 15) return { bg: isDark ? 'bg-amber-500/15' : 'bg-amber-50', text: isDark ? 'text-amber-400' : 'text-amber-600', border: isDark ? 'border-amber-500/20' : 'border-amber-200/50' };
    return { bg: isDark ? 'bg-red-500/15' : 'bg-red-50', text: isDark ? 'text-red-400' : 'text-red-600', border: isDark ? 'border-red-500/20' : 'border-red-200/50' };
  };

  const ssColor = getSpamScoreColor(domain.spam_score ?? 0);

  const metrics = [
    { label: 'Domain Rating', value: domain.dr, icon: TrendingUp, bg: isDark ? 'bg-emerald-500/15' : 'bg-emerald-50', text: isDark ? 'text-emerald-400' : 'text-emerald-600', border: isDark ? 'border-emerald-500/20' : 'border-emerald-200/50' },
    { label: 'Domain Authority', value: domain.da, icon: Globe, bg: isDark ? 'bg-blue-500/15' : 'bg-blue-50', text: isDark ? 'text-blue-400' : 'text-blue-600', border: isDark ? 'border-blue-500/20' : 'border-blue-200/50' },
    { label: 'Page Authority', value: domain.pa ?? 0, icon: Award, bg: isDark ? 'bg-violet-500/15' : 'bg-violet-50', text: isDark ? 'text-violet-400' : 'text-violet-600', border: isDark ? 'border-violet-500/20' : 'border-violet-200/50' },
    { label: 'Spam Score', value: domain.spam_score ?? 0, icon: ShieldAlert, bg: ssColor.bg, text: ssColor.text, border: ssColor.border },
    { label: 'Indexed Pages', value: (domain.indexed ?? 0).toLocaleString(), icon: FileSearch, bg: isDark ? 'bg-cyan-500/15' : 'bg-cyan-50', text: isDark ? 'text-cyan-400' : 'text-cyan-600', border: isDark ? 'border-cyan-500/20' : 'border-cyan-200/50' },
    { label: 'Referring Domains', value: domain.backlinks?.toLocaleString(), icon: Link2, bg: isDark ? 'bg-purple-500/15' : 'bg-purple-50', text: isDark ? 'text-purple-400' : 'text-purple-600', border: isDark ? 'border-purple-500/20' : 'border-purple-200/50' },
    { label: 'Est. Traffic', value: domain.traffic?.toLocaleString(), icon: Eye, bg: isDark ? 'bg-amber-500/15' : 'bg-amber-50', text: isDark ? 'text-amber-400' : 'text-amber-600', border: isDark ? 'border-amber-500/20' : 'border-amber-200/50' },
    { label: 'Domain Age', value: `${domain.age} yrs`, icon: Clock, bg: isDark ? 'bg-rose-500/15' : 'bg-rose-50', text: isDark ? 'text-rose-400' : 'text-rose-600', border: isDark ? 'border-rose-500/20' : 'border-rose-200/50' },
  ];

  const discountedPrice = (domain.discount_percentage ?? 0) > 0
    ? domain.price * (1 - domain.discount_percentage / 100)
    : null;

  const infoRows = [
    { label: 'Domain Name', value: domain.domain_name },
    { label: 'Domain Rating (DR)', value: domain.dr },
    { label: 'Domain Authority (DA)', value: domain.da },
    { label: 'Page Authority (PA)', value: domain.pa ?? 0 },
    { label: 'Spam Score (SS)', value: `${domain.spam_score ?? 0}%`, color: ssColor.text },
    { label: 'Indexed Pages', value: (domain.indexed ?? 0).toLocaleString() },
    { label: 'Backlinks', value: domain.backlinks?.toLocaleString() },
    { label: 'Est. Monthly Traffic', value: domain.traffic?.toLocaleString() },
    { label: 'Domain Age', value: `${domain.age} years` },
    { label: 'Language', value: domain.language || '-' },
    { label: 'TLD', value: domain.tld || '-' },
    { label: 'Registrar', value: domain.registrar || '-' },
  ];

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
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <section className="relative pt-28 pb-8 overflow-hidden">
        <div className="absolute inset-0 hero-pattern"></div>
        <div className={`absolute top-10 right-20 w-64 h-64 ${isDark ? 'bg-violet-500/15' : 'bg-violet-500/10'} rounded-full blur-3xl animate-float`}></div>
        <div className={`absolute bottom-0 left-10 w-80 h-80 ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-500/8'} rounded-full blur-3xl animate-float`} style={{animationDelay: '2s'}}></div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <Link
            href="/domains"
            className="flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors group"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Domains
          </Link>

          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-3" data-testid="domain-name">
                {domain.domain_name}
              </h1>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold ${
                  domain.status === 'available' ? 'status-available' : 'status-sold'
                }`} data-testid="domain-status">
                  {domain.status === 'available' ? 'Available' : 'Sold'}
                </span>
                {discountedPrice && (
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold ${isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`} data-testid="domain-discount-badge">
                    -{domain.discount_percentage}% OFF
                  </span>
                )}
              </div>
            </div>
          </div>

          {domain.description && (
            <p className="text-lg text-muted-foreground mt-4 max-w-2xl" data-testid="domain-description">
              {domain.description}
            </p>
          )}
        </div>
      </section>

      {/* Main Content */}
      <div className="pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left - Metrics & Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Metrics Grid */}
              <ScrollReveal direction="up" duration={600}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {metrics.map((metric, index) => (
                    <div
                      key={metric.label}
                      className={`group rounded-2xl p-5 text-center backdrop-blur-xl border transition-all duration-300 hover:scale-[1.03] hover:shadow-lg ${
                        isDark
                          ? 'bg-white/[0.03] border-white/10 hover:border-violet-500/30 hover:shadow-violet-500/5'
                          : 'bg-white/90 border-slate-200/60 hover:border-violet-300 hover:shadow-violet-200/30'
                      }`}
                      data-testid={`metric-${index}`}
                    >
                      <div className={`w-12 h-12 ${metric.bg} border ${metric.border} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                        <metric.icon className={`w-5 h-5 ${metric.text}`} />
                      </div>
                      <p className="text-2xl font-bold text-foreground mb-0.5">{metric.value}</p>
                      <p className="text-xs text-muted-foreground font-medium">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </ScrollReveal>

              {/* Domain Information */}
              <ScrollReveal direction="up" delay={150} duration={600}>
                <div className={`rounded-2xl backdrop-blur-xl border overflow-hidden ${
                  isDark
                    ? 'bg-white/[0.03] border-white/10 shadow-xl shadow-black/10'
                    : 'bg-white/90 border-slate-200/60 shadow-xl shadow-slate-200/30'
                }`}>
                  <div className={`px-8 py-5 border-b ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/60'}`}>
                    <h3 className="text-lg font-bold text-foreground">{t('domainDetail.additionalInfo')}</h3>
                  </div>
                  <div className="p-8">
                    <div className="space-y-0">
                      {infoRows.map((row, i) => (
                        <div key={row.label} className={`flex justify-between py-4 ${i < infoRows.length - 1 ? `border-b ${isDark ? 'border-white/5' : 'border-slate-100'}` : ''}`}>
                          <span className="text-muted-foreground text-sm">{row.label}</span>
                          <span className={`font-semibold text-sm ${row.color || 'text-foreground'}`}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Sidebar - Price Box */}
            <div className="lg:col-span-1">
              <div className={`rounded-2xl backdrop-blur-xl border sticky top-28 overflow-hidden ${
                isDark
                  ? 'bg-white/[0.03] border-white/10 shadow-xl shadow-black/10'
                  : 'bg-white/90 border-slate-200/60 shadow-xl shadow-slate-200/30'
              }`}>
                {/* Price Header */}
                <div className="p-8 text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <p className="text-sm text-muted-foreground font-medium">Price</p>
                    <CurrencySelector className="h-7 w-20 text-xs" />
                  </div>
                  {discountedPrice ? (
                    <div>
                      <p className="text-lg text-muted-foreground line-through" data-testid="domain-original-price">
                        {formatPrice(domain.price || 0)}
                      </p>
                      <p className="text-4xl font-bold gradient-text my-2" data-testid="domain-price">
                        {formatPrice(discountedPrice)}
                      </p>
                      <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                        Save {domain.discount_percentage}%
                      </span>
                    </div>
                  ) : (
                    <p className="text-4xl font-bold gradient-text" data-testid="domain-price">
                      {formatPrice(domain.price || 0)}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="px-8 pb-8">
                  {domain.status === 'available' ? (
                    <div className="space-y-3">
                      <Link href="/#contact" className="block" onClick={() => trackDomainClick(slug)}>
                        <Button
                          className="w-full btn-gradient text-white rounded-full py-6 text-lg font-semibold shadow-xl shadow-violet-500/25 hover:shadow-violet-500/35 transition-all duration-300"
                          data-testid="buy-now-btn"
                        >
                          {t('domainDetail.buyNow')}
                        </Button>
                      </Link>
                      <Button
                        onClick={() => toggleWishlist(domain)}
                        variant="outline"
                        className={`w-full rounded-full py-6 text-lg font-semibold border-2 transition-all duration-300 ${
                          isInWishlist(domain.id)
                            ? (isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100')
                            : (isDark ? 'border-white/15 hover:border-rose-500/30 hover:bg-rose-500/5' : 'border-slate-200 hover:border-rose-300 hover:bg-rose-50/50')
                        }`}
                        data-testid="wishlist-detail-btn"
                      >
                        <Heart className={`w-5 h-5 mr-2 ${isInWishlist(domain.id) ? 'fill-current' : ''}`} />
                        {isInWishlist(domain.id) ? t('domainDetail.savedToWishlist') : t('domainDetail.addToWishlist')}
                      </Button>
                      <Link href="/#contact" className="block" onClick={() => trackDomainClick(slug)}>
                        <Button
                          variant="outline"
                          className={`w-full rounded-full py-6 text-lg font-semibold border-2 transition-all duration-300 ${isDark ? 'border-white/15 hover:border-white/30 hover:bg-white/5' : 'border-slate-200 hover:border-violet-300 hover:bg-violet-50/50'}`}
                          data-testid="contact-btn"
                        >
                          <Mail className="w-5 h-5 mr-2" />
                          {t('domainDetail.contactUs')}
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className={`rounded-xl p-5 text-center ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-200'}`}>
                      <p className="text-muted-foreground font-medium">This domain has been sold</p>
                      <Link href="/domains" className="text-violet-500 hover:text-violet-400 font-semibold text-sm mt-2 inline-block transition-colors">
                        Browse other domains →
                      </Link>
                    </div>
                  )}
                </div>

                {/* Why Buy */}
                <div className={`px-8 py-6 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                  <h4 className="font-bold text-foreground mb-4">Why Buy This Domain?</h4>
                  <ul className="space-y-3">
                    {[
                      'High domain authority for instant SEO boost',
                      'Established backlink profile',
                      'Fast transfer within 24-48 hours',
                      'Clean history verified',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start text-sm text-muted-foreground group">
                        <CheckCircle className={`w-4 h-4 mt-0.5 mr-3 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
                        <span className="group-hover:text-foreground transition-colors duration-200">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DomainDetailPage;
