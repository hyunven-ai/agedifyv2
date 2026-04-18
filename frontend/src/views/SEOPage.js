"use client";
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Globe, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { getSEOPageBySlug } from '../lib/api';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';

const SEOPage = () => {
  const { slug } = useParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const response = await getSEOPageBySlug(slug);
        setPage(response.data);
        document.title = `${response.data.meta_title || response.data.title} | Agedify`;
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    loadPage();
  }, [slug]);

  // Meta tags and schema effect
  useEffect(() => {
    if (!page) return;
    
    const pageDescription = page.meta_description || page.subheadline || '';
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = pageDescription;

    // Add page schema
    const pageSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": page.title,
      "description": page.meta_description,
      "headline": page.headline
    };

    let schemaScript = document.querySelector('script[data-schema="page"]');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
      schemaScript.setAttribute('data-schema', 'page');
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify(pageSchema);

    // Add FAQ schema if available
    if (page.faq_items && page.faq_items.length > 0) {
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": page.faq_items.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      };

      let faqScript = document.querySelector('script[data-schema="faq"]');
      if (!faqScript) {
        faqScript = document.createElement('script');
        faqScript.type = 'application/ld+json';
        faqScript.setAttribute('data-schema', 'faq');
        document.head.appendChild(faqScript);
      }
      faqScript.textContent = JSON.stringify(faqSchema);
    }

    return () => {
      const pageScript = document.querySelector('script[data-schema="page"]');
      const faqScript = document.querySelector('script[data-schema="faq"]');
      if (pageScript) pageScript.remove();
      if (faqScript) faqScript.remove();
    };
  }, [page]);

  // Handle redirect for not found
  useEffect(() => {
    if (notFound) {
      router.push('/', { replace: true });
    }
  }, [notFound, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
      </div>
    );
  }

  if (notFound || !page) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center" data-testid="logo">
              <Image src="/logo-agedify.png" alt="Agedify" width={160} height={40} priority className="h-10 w-auto" />
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Home</Link>
              <Link href="/domains" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Domains</Link>
              <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Blog</Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/domains">
                <Button className={`${isDark ? 'bg-white text-[#0F172A] hover:bg-slate-100' : 'bg-[#0F172A] hover:bg-[#1E293B] text-white'} rounded-full px-6`}>
                  View Domains
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Breadcrumb */}
          <nav className="mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground">Home</Link></li>
              <li><ChevronRight className="w-4 h-4" /></li>
              <li className="text-foreground">{page.title}</li>
            </ol>
          </nav>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6" data-testid="seo-page-headline">
            {page.headline}
          </h1>
          {page.subheadline && (
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {page.subheadline}
            </p>
          )}
          
          {page.cta_text && page.cta_link && (
            <Link href={page.cta_link}>
              <Button className={`${isDark ? 'bg-white text-[#0F172A] hover:bg-slate-100' : 'bg-[#0F172A] hover:bg-[#1E293B] text-white'} rounded-full px-8 py-6 text-lg`}>
                {page.cta_text}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Content Blocks */}
      {page.content_blocks && page.content_blocks.length > 0 && (
        <section className="py-16 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {page.content_blocks.map((block, index) => (
              <div key={index} className="content-block">
                {block.type === 'heading' && (
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    {block.content}
                  </h2>
                )}
                {block.type === 'text' && (
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {block.content}
                  </p>
                )}
                {block.type === 'list' && (
                  <ul className="space-y-3">
                    {block.content.split('\n').map((item, i) => (
                      <li key={i} className="flex items-start">
                        <ChevronRight className="w-5 h-5 text-blue-500 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {page.faq_items && page.faq_items.length > 0 && (
        <section className={`py-16 px-6 lg:px-8 ${isDark ? 'bg-card' : 'bg-slate-50'}`}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {page.faq_items.map((faq, index) => (
                <div 
                  key={index}
                  className={`${isDark ? 'bg-background' : 'bg-white'} rounded-2xl p-6 shadow-lg`}
                >
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="py-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`${isDark ? 'bg-card' : 'bg-[#0F172A]'} rounded-3xl p-12`}>
            <h2 className={`text-3xl font-bold ${isDark ? 'text-foreground' : 'text-white'} mb-4`}>
              Ready to Get Started?
            </h2>
            <p className={`${isDark ? 'text-muted-foreground' : 'text-slate-300'} mb-8 max-w-xl mx-auto`}>
              Browse our collection of premium aged domains and find the perfect one for your business.
            </p>
            <Link href="/domains">
              <Button className={`${isDark ? 'bg-white text-[#0F172A] hover:bg-slate-100' : 'bg-white text-[#0F172A] hover:bg-slate-100'} rounded-full px-8 py-6 text-lg`}>
                Browse All Domains
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <Image src="/logo-agedify.png" alt="Agedify" width={128} height={32} className="h-8 w-auto" />
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Agedify. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SEOPage;
