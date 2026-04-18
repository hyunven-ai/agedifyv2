"use client";
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Globe, TrendingUp, Shield, Clock, Search, ArrowRight, CheckCircle, Mail, Phone, MapPin, ChevronDown, ChevronUp, Menu, X, FileText, Calendar, Heart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { getFeaturedDomains, submitContact, getPublicBlogPosts } from '../lib/api';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import ParticleField from '../components/ParticleField';
import HeroAnimations, { TypedText } from '../components/HeroAnimations';
import ScrollReveal from '../components/ScrollReveal';
import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';

const LandingPage = () => {
  const { isDark } = useTheme();
  const { isInWishlist, toggleWishlist, wishlistCount } = useWishlist();
  const { t } = useLanguage();
  const [featuredDomains, setFeaturedDomains] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadFeaturedDomains();
    loadBlogPosts();
  }, []);

  const loadFeaturedDomains = async () => {
    try {
      const response = await getFeaturedDomains();
      setFeaturedDomains(response.data);
    } catch (error) {
      console.error('Error loading featured domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBlogPosts = async () => {
    try {
      const response = await getPublicBlogPosts({ limit: 3 });
      setBlogPosts(response.data);
    } catch (error) {
      console.error('Error loading blog posts:', error);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitContact(contactForm);
      toast.success('Message sent successfully! We will get back to you soon.');
      setContactForm({ name: '', email: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const benefits = [
    { icon: Globe, titleKey: 'benefits.items.0.title', descKey: 'benefits.items.0.desc', titleFallback: 'Authority Backlinks', descFallback: 'Inherit high-quality backlinks from established domains' },
    { icon: TrendingUp, titleKey: 'benefits.items.1.title', descKey: 'benefits.items.1.desc', titleFallback: 'Faster Ranking', descFallback: 'Skip the sandbox period and rank faster on search engines' },
    { icon: Clock, titleKey: 'benefits.items.2.title', descKey: 'benefits.items.2.desc', titleFallback: 'Established History', descFallback: 'Benefit from years of domain age and trust signals' },
    { icon: Shield, titleKey: 'benefits.items.3.title', descKey: 'benefits.items.3.desc', titleFallback: 'SEO Ready', descFallback: 'Pre-vetted domains ready for immediate SEO campaigns' },
  ];

  const steps = [
    { number: '01', titleKey: 'howItWorks.steps.0.title', descKey: 'howItWorks.steps.0.desc', titleFallback: 'Browse Domains', descFallback: 'Explore our curated collection of premium aged domains' },
    { number: '02', titleKey: 'howItWorks.steps.1.title', descKey: 'howItWorks.steps.1.desc', titleFallback: 'Contact Us', descFallback: 'Reach out for detailed metrics and pricing information' },
    { number: '03', titleKey: 'howItWorks.steps.2.title', descKey: 'howItWorks.steps.2.desc', titleFallback: 'Secure Payment', descFallback: 'Complete your purchase through our secure payment system' },
    { number: '04', titleKey: 'howItWorks.steps.3.title', descKey: 'howItWorks.steps.3.desc', titleFallback: 'Fast Transfer', descFallback: 'Receive your domain within 24-48 hours' },
  ];

  const faqs = [
    { question: 'What is an aged domain?', answer: 'An aged domain is a domain name that has been registered for several years, often with existing backlinks, traffic history, and search engine trust. These domains can provide significant SEO advantages.' },
    { question: 'How does the transfer process work?', answer: 'After payment confirmation, we initiate the domain transfer to your registrar account. The process typically takes 24-48 hours, and we provide full support throughout.' },
    { question: 'Are these domains safe to use?', answer: 'Yes, all domains are thoroughly vetted for spam history, penalties, and blacklist status. We only list domains with clean histories and legitimate backlink profiles.' },
    { question: 'What payment methods do you accept?', answer: 'We accept major credit cards, bank transfers, and cryptocurrency payments. Contact us for specific payment arrangements.' },
  ];

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-4">
            <Link href="/" className="flex items-center" data-testid="logo">
              <Image src="/logo-agedify.png" alt="Agedify" width={224} height={56} priority className="h-14 w-auto" />
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-2">
              <a href="#benefits" className="px-4 py-2 text-base text-muted-foreground hover:text-foreground transition-all duration-200 rounded-lg hover:bg-accent/10 font-semibold">{t('nav.benefits')}</a>
              <a href="#domains" className="px-4 py-2 text-base text-muted-foreground hover:text-foreground transition-all duration-200 rounded-lg hover:bg-accent/10 font-semibold">{t('nav.domains')}</a>
              <a href="#blog" className="px-4 py-2 text-base text-muted-foreground hover:text-foreground transition-all duration-200 rounded-lg hover:bg-accent/10 font-semibold">{t('nav.blog')}</a>
              <a href="#about" className="px-4 py-2 text-base text-muted-foreground hover:text-foreground transition-all duration-200 rounded-lg hover:bg-accent/10 font-semibold">{t('nav.about')}</a>
              <a href="#contact" className="px-4 py-2 text-base text-muted-foreground hover:text-foreground transition-all duration-200 rounded-lg hover:bg-accent/10 font-semibold">{t('nav.contact')}</a>
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
              <ThemeToggle />
              <LanguageToggle />
              <Link href="/domains">
                <Button data-testid="nav-view-domains-btn" className="btn-gradient text-white rounded-full px-7 h-11 text-base font-medium shadow-lg shadow-violet-500/25">
                  {t('nav.viewDomains')}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <Link href="/wishlist" className="relative p-2 rounded-xl" data-testid="wishlist-nav-icon-mobile">
                <Heart className={`w-5 h-5 ${wishlistCount > 0 ? 'text-rose-500 fill-rose-500' : 'text-muted-foreground'}`} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <LanguageToggle />
              <ThemeToggle />
              <button 
                className="p-2 text-foreground rounded-lg hover:bg-accent/10 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="mobile-menu-btn"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden glass border-t border-border/50 py-4 px-6 animate-fade-in">
            <div className="flex flex-col space-y-1">
              <a href="#benefits" className="text-muted-foreground hover:text-foreground hover:bg-accent/10 font-medium py-3 px-4 rounded-lg transition-all" onClick={() => setMobileMenuOpen(false)}>{t('nav.benefits')}</a>
              <a href="#domains" className="text-muted-foreground hover:text-foreground hover:bg-accent/10 font-medium py-3 px-4 rounded-lg transition-all" onClick={() => setMobileMenuOpen(false)}>{t('nav.domains')}</a>
              <a href="#blog" className="text-muted-foreground hover:text-foreground hover:bg-accent/10 font-medium py-3 px-4 rounded-lg transition-all" onClick={() => setMobileMenuOpen(false)}>{t('nav.blog')}</a>
              <a href="#about" className="text-muted-foreground hover:text-foreground hover:bg-accent/10 font-medium py-3 px-4 rounded-lg transition-all" onClick={() => setMobileMenuOpen(false)}>{t('nav.about')}</a>
              <a href="#contact" className="text-muted-foreground hover:text-foreground hover:bg-accent/10 font-medium py-3 px-4 rounded-lg transition-all" onClick={() => setMobileMenuOpen(false)}>{t('nav.contact')}</a>
              <Link href="/domains" onClick={() => setMobileMenuOpen(false)} className="mt-2">
                <Button className="btn-gradient text-white rounded-full w-full font-medium">
                  {t('nav.viewDomains')}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0 hero-pattern"></div>
        
        {/* Particle Network Background */}
        <ParticleField />

        {/* Animated Background Blobs with parallax */}
        <div className={`absolute top-20 right-10 w-72 h-72 ${isDark ? 'bg-violet-500/20' : 'bg-violet-500/10'} rounded-full blur-3xl animate-float`} style={{ zIndex: 0 }}></div>
        <div className={`absolute bottom-20 left-10 w-96 h-96 ${isDark ? 'bg-cyan-500/15' : 'bg-cyan-500/10'} rounded-full blur-3xl animate-float`} style={{animationDelay: '2s', zIndex: 0}}></div>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] ${isDark ? 'bg-violet-500/5' : 'bg-violet-500/5'} rounded-full blur-3xl`} style={{ zIndex: 0 }}></div>

        {/* Floating Animated Illustrations */}
        <HeroAnimations />
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8" style={{ zIndex: 3 }}>
          <div className="text-center max-w-4xl mx-auto">
            <span className={`inline-flex items-center gap-2 px-4 py-2 ${isDark ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-violet-50 text-violet-600 border border-violet-200'} rounded-full text-sm font-semibold mb-8 animate-fade-in-up`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
              Premium Domain Marketplace
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-foreground tracking-tight mb-8 animate-fade-in-up animation-delay-100" data-testid="hero-title">
              {t('hero.title1')}{' '}
              <br className="hidden sm:block" />
              <TypedText
                words={['SEO Domination', 'Higher Rankings', 'Authority Building', 'Organic Traffic']}
                className="gradient-text"
              />
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
              <Link href="/domains">
                <Button data-testid="hero-browse-btn" size="lg" className="btn-magnetic btn-gradient text-white rounded-full px-8 py-6 text-lg font-semibold shadow-xl shadow-violet-500/30 hover:shadow-violet-500/40 group">
                  {t('hero.cta')}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
              <a href="#contact">
                <Button data-testid="hero-contact-btn" size="lg" variant="outline" className={`btn-magnetic rounded-full px-8 py-6 text-lg font-semibold border-2 transition-all duration-300 ${isDark ? 'border-white/20 hover:border-white/40 hover:bg-white/5 text-foreground' : 'border-slate-200 hover:border-violet-300 hover:bg-violet-50/50'}`}>
                  {t('contactForm.title')}
                </Button>
              </a>
            </div>
            
            {/* Trust Badges */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 animate-fade-in-up animation-delay-400">
              <div className="flex items-center gap-2 text-muted-foreground group cursor-default">
                <CheckCircle className="w-5 h-5 text-emerald-500 group-hover:scale-125 transition-transform duration-200" />
                <span className="text-sm font-medium">Verified Domains</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground group cursor-default">
                <Shield className="w-5 h-5 text-violet-500 group-hover:scale-125 transition-transform duration-200" />
                <span className="text-sm font-medium">Secure Transfer</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground group cursor-default">
                <Clock className="w-5 h-5 text-cyan-500 group-hover:scale-125 transition-transform duration-200" />
                <span className="text-sm font-medium">24/48h Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 md:py-32 bg-secondary/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <ScrollReveal direction="up" duration={700}>
            <div className="text-center mb-20">
              <span className={`inline-block px-4 py-1.5 ${isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-600'} rounded-full text-sm font-semibold mb-4 tracking-wide uppercase`}>{t('benefits.badge')}</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                {t('benefits.title')} <span className="gradient-text">{t('benefits.titleHighlight')}</span>
              </h2>
            </div>
          </ScrollReveal>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <ScrollReveal key={index} direction="up" delay={index * 120} duration={600}>
                <div 
                  className={`group relative ${isDark ? 'bg-card/80' : 'bg-white'} rounded-2xl p-8 card-glow border border-border/50 hover:border-violet-500/30 transition-all duration-300 h-full`}
                  data-testid={`benefit-card-${index}`}
                >
                  {/* Hover glow accent */}
                  <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${isDark ? 'bg-gradient-to-br from-violet-500/5 to-cyan-500/5' : 'bg-gradient-to-br from-violet-50/50 to-cyan-50/50'}`} />
                  <div className="relative">
                    <div className={`w-14 h-14 ${isDark ? 'bg-gradient-to-br from-violet-500/30 to-cyan-500/30' : 'bg-gradient-to-br from-violet-100 to-cyan-100'} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <benefit.icon className={`w-7 h-7 ${isDark ? 'text-violet-400' : 'text-violet-600'} group-hover:scale-110 transition-transform duration-300`} />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-violet-500 transition-colors duration-300">{t(benefit.titleKey)}</h3>
                    <p className="text-muted-foreground leading-relaxed">{t(benefit.descKey)}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Domains Section */}
      <section id="domains" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <ScrollReveal direction="up" duration={700}>
            <div className="text-center mb-20">
              <span className={`inline-block px-4 py-1.5 ${isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-600'} rounded-full text-sm font-semibold mb-4 tracking-wide uppercase`}>Featured Listings</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                Premium Domains <span className="gradient-text">Available</span>
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={150} duration={700}>
            <div className={`${isDark ? 'bg-card/50 border border-border/50' : 'bg-white border border-border/30'} rounded-3xl shadow-xl overflow-hidden backdrop-blur-sm`}>
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="featured-domains-table">
                <thead>
                  <tr className={`${isDark ? 'bg-secondary/50' : 'bg-slate-50/80'} border-b border-border/50`}>
                    <th className="text-left py-5 px-6 font-semibold text-muted-foreground text-sm">Domain</th>
                    <th className="text-center py-5 px-4 font-semibold text-muted-foreground text-sm">DR</th>
                    <th className="text-center py-5 px-4 font-semibold text-muted-foreground text-sm">DA</th>
                    <th className="text-center py-5 px-4 font-semibold text-muted-foreground text-sm hidden md:table-cell">Ref Domains</th>
                    <th className="text-center py-5 px-4 font-semibold text-muted-foreground text-sm hidden md:table-cell">Indexed</th>
                    <th className="text-center py-5 px-4 font-semibold text-muted-foreground text-sm hidden sm:table-cell">Age</th>
                    <th className="text-right py-5 px-6 font-semibold text-muted-foreground text-sm">Price</th>
                    <th className="text-center py-5 px-6 font-semibold text-muted-foreground text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent mx-auto"></div>
                      </td>
                    </tr>
                  ) : featuredDomains.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-16 text-muted-foreground">
                        No domains available yet. Check back soon!
                      </td>
                    </tr>
                  ) : (
                    featuredDomains.map((domain, index) => (
                      <tr key={domain.id} className="border-b border-border/50 hover:bg-accent/5 transition-colors duration-200" data-testid={`domain-row-${index}`}>
                        <td className="py-5 px-6">
                          <span className="font-semibold text-foreground">{domain.domain_name}</span>
                        </td>
                        <td className="text-center py-5 px-4">
                          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'} font-bold text-sm`}>
                            {domain.dr}
                          </span>
                        </td>
                        <td className="text-center py-5 px-4">
                          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'} font-bold text-sm`}>
                            {domain.da}
                          </span>
                        </td>
                        <td className="text-center py-5 px-4 text-muted-foreground font-medium hidden md:table-cell">{domain.backlinks?.toLocaleString()}</td>
                        <td className="text-center py-5 px-4 hidden md:table-cell">
                          {(domain.indexed ?? 0) > 0 ? (
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}><CheckCircle className="w-4 h-4" /></span>
                          ) : (
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-500'}`}><X className="w-4 h-4" /></span>
                          )}
                        </td>
                        <td className="text-center py-5 px-4 text-muted-foreground font-medium hidden sm:table-cell">{domain.age} yrs</td>
                        <td className="text-right py-5 px-6">
                          {(domain.discount_percentage ?? 0) > 0 ? (
                            <div>
                              <span className="text-sm text-muted-foreground line-through block">${domain.price?.toLocaleString()}</span>
                              <span className="font-bold text-foreground text-lg">${(domain.price * (1 - domain.discount_percentage / 100)).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                              <span className={`ml-1 text-xs font-semibold px-1.5 py-0.5 rounded-full ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>-{domain.discount_percentage}%</span>
                            </div>
                          ) : (
                            <span className="font-bold text-foreground text-lg">${domain.price?.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="text-center py-5 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => toggleWishlist(domain)}
                              className={`p-2 rounded-xl transition-all duration-200 ${
                                isInWishlist(domain.id)
                                  ? 'text-rose-500'
                                  : (isDark ? 'hover:bg-white/10 text-muted-foreground hover:text-rose-400' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-500')
                              }`}
                              title={isInWishlist(domain.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                              data-testid={`wishlist-featured-btn-${index}`}
                            >
                              <Heart className={`w-4 h-4 ${isInWishlist(domain.id) ? 'fill-current' : ''}`} />
                            </button>
                            <Link href={`/domain/${domain.slug}`}>
                              <Button size="sm" className="btn-gradient text-white rounded-full px-5 shadow-md shadow-violet-500/20 hover:shadow-violet-500/30">
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
          </ScrollReveal>

          <ScrollReveal direction="up" delay={250}>
            <div className="text-center mt-12">
              <Link href="/domains">
                <Button data-testid="view-all-domains-btn" size="lg" className="btn-gradient text-white rounded-full px-8 py-6 font-semibold shadow-xl shadow-violet-500/25">
                  View All Domains
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 md:py-32 bg-gradient-to-br from-slate-900 via-violet-950/50 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <ScrollReveal direction="up" duration={700}>
            <div className="text-center mb-20">
              <span className="inline-block px-4 py-1.5 bg-violet-500/20 text-violet-300 rounded-full text-sm font-semibold mb-4 tracking-wide uppercase">{t('howItWorks.badge')}</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                {t('howItWorks.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">{t('howItWorks.titleHighlight')}</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connecting line between steps (desktop only) */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-[2px]">
              <div className="w-full h-full bg-gradient-to-r from-violet-500/40 via-cyan-500/40 to-violet-500/40 animate-shimmer-line" />
            </div>
            {steps.map((step, index) => (
              <ScrollReveal key={step.number} direction="up" delay={index * 150} duration={600}>
                <div className="text-center group relative" data-testid={`step-${index}`}>
                  <div className="w-20 h-20 bg-gradient-to-br from-violet-500/30 to-cyan-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border border-white/10 group-hover:border-violet-400/40 group-hover:shadow-lg group-hover:shadow-violet-500/20 relative z-10">
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-violet-300 transition-colors duration-300">{t(step.titleKey)}</h3>
                  <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-300">{t(step.descKey)}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal direction="left" duration={700}>
              <div>
                <span className={`inline-block px-4 py-1.5 ${isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-600'} rounded-full text-sm font-semibold mb-4 tracking-wide uppercase`}>{t('about.badge')}</span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8">
                  {t('about.heading1')}<span className="gradient-text">{t('about.heading2')}</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  {t('about.description')}
                </p>
                <ul className="space-y-4">
                  {(t('about.points') || ['Quality Checked Domains', 'Global SEO Use Cases', 'Fast & Secure Transfers', '24/7 Support']).map((item, index) => (
                    <li key={index} className="flex items-center text-foreground group">
                      <div className={`w-6 h-6 rounded-full ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'} flex items-center justify-center mr-4 group-hover:scale-110 transition-transform`}>
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      </div>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={200} duration={700}>
              <div className="relative">
                <div className={`${isDark ? 'bg-gradient-to-br from-violet-500/20 to-cyan-500/20' : 'bg-gradient-to-br from-violet-100 to-cyan-100'} rounded-3xl overflow-hidden p-1`}>
                  <Image 
                    src="https://images.unsplash.com/photo-1758518727707-b023e285b709?crop=entropy&cs=srgb&fm=jpg&q=85&w=600" 
                    alt="Professional team"
                    width={600}
                    height={400}
                    className="w-full h-[400px] object-cover rounded-2xl"
                  />
                </div>
                <div className={`absolute -bottom-6 -left-6 ${isDark ? 'bg-card/90 backdrop-blur-xl border border-white/10' : 'bg-white/90 backdrop-blur-xl border border-slate-200'} rounded-2xl shadow-2xl p-6`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-14 h-14 ${isDark ? 'bg-gradient-to-br from-emerald-500/30 to-cyan-500/30' : 'bg-gradient-to-br from-emerald-100 to-cyan-100'} rounded-2xl flex items-center justify-center`}>
                      <Shield className={`w-7 h-7 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">500+</p>
                      <p className="text-muted-foreground text-sm">{t('about.domainsSold')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-24 md:py-32 bg-secondary/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <ScrollReveal direction="up" duration={700}>
            <div className="text-center mb-20">
              <span className={`inline-block px-4 py-1.5 ${isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-600'} rounded-full text-sm font-semibold mb-4 tracking-wide uppercase`}>{t('blog.sectionBadge')}</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                {t('blog.sectionTitle1')}<span className="gradient-text">{t('blog.sectionTitle2')}</span>
              </h2>
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('blog.sectionSubtitle')}
              </p>
            </div>
          </ScrollReveal>

          {blogPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post, index) => (
                <ScrollReveal key={post.id} direction="up" delay={index * 150} duration={600}>
                  <Link 
                    href={`/blog/${post.slug}`}
                    className={`${isDark ? 'bg-card' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden card-hover group block h-full`}
                    data-testid={`blog-card-${index}`}
                  >
                  {post.featured_image ? (
                    <div className="aspect-video overflow-hidden relative">
                      <Image 
                        src={post.featured_image.startsWith('/api') ? post.featured_image : post.featured_image}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className={`aspect-video ${isDark ? 'bg-slate-800' : 'bg-slate-100'} flex items-center justify-center`}>
                      <FileText className={`w-12 h-12 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                    </div>
                  )}
                  <div className="p-6">
                    {post.category && (
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-3 ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                        {post.category.name}
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-blue-500 transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-1.5" />
                      {new Date(post.published_at || post.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <ScrollReveal direction="up">
              <div className={`${isDark ? 'bg-card' : 'bg-white'} rounded-2xl p-12 text-center`}>
              <FileText className={`w-16 h-16 ${isDark ? 'text-slate-600' : 'text-slate-300'} mx-auto mb-4`} />
              <p className="text-muted-foreground">{t('blog.noBlogYet')}</p>
            </div>
            </ScrollReveal>
          )}

          <div className="text-center mt-10">
            <Link href="/blog">
              <Button data-testid="view-all-blogs-btn" size="lg" className={`${isDark ? 'bg-white text-[#0F172A] hover:bg-slate-100' : 'bg-[#0F172A] hover:bg-[#1E293B] text-white'} rounded-full px-8`}>
                {t('blog.viewAll')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <ScrollReveal direction="up" duration={700}>
            <div className="text-center mb-16">
              <span className="text-sm font-semibold text-blue-500 tracking-wide uppercase">FAQ</span>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold text-foreground">
                {t('faq.title')}
              </h2>
            </div>
          </ScrollReveal>

          <div className="space-y-4">
            {(t('faq.items') || faqs).map((faq, index) => (
              <ScrollReveal key={index} direction="up" delay={index * 100} duration={500}>
                <div 
                  className={`${isDark ? 'bg-card' : 'bg-white'} rounded-2xl shadow-sm overflow-hidden`}
                  data-testid={`faq-item-${index}`}
                >
                  <button
                    className="w-full px-6 py-5 flex items-center justify-between text-left"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    data-testid={`faq-toggle-${index}`}
                  >
                    <span className="font-semibold text-foreground">{faq.q || faq.question}</span>
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-5 text-muted-foreground animate-fade-in">
                      {faq.a || faq.answer}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <ScrollReveal direction="left" duration={700}>
              <div>
              <span className="text-sm font-semibold text-blue-500 tracking-wide uppercase">{t('contactForm.badge')}</span>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold text-foreground mb-6">
                {t('contactForm.heading')}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {t('contactForm.subtitle')}
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className={`w-12 h-12 ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'} rounded-xl flex items-center justify-center mr-4`}>
                    <Mail className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('contactForm.emailLabel')}</p>
                    <p className="font-semibold text-foreground">support@agedify.com</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className={`w-12 h-12 ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'} rounded-xl flex items-center justify-center mr-4`}>
                    <Phone className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('contactForm.phoneLabel')}</p>
                    <p className="font-semibold text-foreground">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className={`w-12 h-12 ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'} rounded-xl flex items-center justify-center mr-4`}>
                    <MapPin className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('contactForm.locationLabel')}</p>
                    <p className="font-semibold text-foreground">{t('contactForm.locationValue')}</p>
                  </div>
                </div>
              </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={200} duration={700}>
              <div className={`${isDark ? 'bg-card' : 'bg-white'} rounded-2xl shadow-lg p-8`}>
              <form onSubmit={handleContactSubmit} data-testid="contact-form">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t('contactForm.name')}</label>
                    <Input
                      data-testid="contact-name-input"
                      placeholder={t('contactForm.namePlaceholder')}
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                      className="h-12 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t('contactForm.email')}</label>
                    <Input
                      data-testid="contact-email-input"
                      type="email"
                      placeholder={t('contactForm.emailPlaceholder')}
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                      className="h-12 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t('contactForm.message')}</label>
                    <Textarea
                      data-testid="contact-message-input"
                      placeholder={t('contactForm.messagePlaceholder')}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      required
                      rows={5}
                      className="rounded-lg resize-none"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className={`w-full ${isDark ? 'bg-white text-[#0F172A] hover:bg-slate-100' : 'bg-[#0F172A] hover:bg-[#1E293B] text-white'} rounded-full py-6 text-lg btn-active`}
                    data-testid="contact-submit-btn"
                  >
                    {submitting ? t('contactForm.sending') : t('contactForm.submit')}
                  </Button>
                </div>
              </form>
            </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${isDark ? 'bg-[#020617]' : 'bg-[#0F172A]'} py-16`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6">
                <Image src="/logo-agedify.png" alt="Agedify" width={224} height={56} priority className="h-14 w-auto" />
              </div>
              <p className="text-slate-400 max-w-md">
                {t('footer.tagline')}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">{t('footer.quickLinks')}</h4>
              <ul className="space-y-3">
                <li><Link href="/domains" className="text-slate-400 hover:text-white transition-colors">{t('footer.browseDomains')}</Link></li>
                <li><Link href="/blog" className="text-slate-400 hover:text-white transition-colors">{t('footer.blog')}</Link></li>
                <li><a href="#about" className="text-slate-400 hover:text-white transition-colors">{t('footer.aboutUs')}</a></li>
                <li><a href="#contact" className="text-slate-400 hover:text-white transition-colors">{t('footer.contactLink')}</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">{t('footer.faqLink')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">{t('footer.legal')}</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">{t('footer.privacy')}</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">{t('footer.terms')}</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">{t('footer.refund')}</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-12 pt-8 text-center">
            <p className="text-slate-400">&copy; {new Date().getFullYear()} Agedify. {t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
