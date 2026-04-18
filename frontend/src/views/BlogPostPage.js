"use client";
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Globe, Calendar, User, Tag, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { getBlogPostBySlug } from '../lib/api';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import SocialShare from '../components/SocialShare';

const BlogPostPage = () => {
  const { slug } = useParams();
  const { isDark } = useTheme();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const response = await getBlogPostBySlug(slug);
        setPost(response.data);
      } catch (err) {
        setError('Post not found');
      } finally {
        setLoading(false);
      }
    };
    loadPost();
  }, [slug]);

  // Update page title
  useEffect(() => {
    if (!post) return;
    document.title = `${post.meta_title || post.title} | Agedify Blog`;
  }, [post]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getReadingTime = (content) => {
    if (!content) return 1;
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.ceil(words / 200);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Post Not Found</h2>
          <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist.</p>
          <Link href="/blog">
            <Button className={`${isDark ? 'bg-white text-[#0F172A]' : 'bg-[#0F172A] text-white'} rounded-full`}>
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <Image src="/logo-agedify.png" alt="Agedify" width={160} height={40} priority className="h-10 w-auto" />
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Home</Link>
              <Link href="/domains" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Domains</Link>
              <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Blog</Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <article className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground">Home</Link></li>
              <li>/</li>
              <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
              <li>/</li>
              <li className="text-foreground truncate max-w-[200px]">{post.title}</li>
            </ol>
          </nav>

          {/* Back Button */}
          <Link 
            href="/blog"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Blog
          </Link>

          {/* Header */}
          <header className="mb-8">
            {post.category && (
              <span className={`inline-block px-3 py-1 ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'} rounded-full text-sm font-semibold mb-4`}>
                {post.category.name}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6" data-testid="post-title">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <span className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                {post.author}
              </span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {formatDate(post.published_at)}
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {getReadingTime(post.content)} min read
              </span>
            </div>

            {/* Social Share - Top */}
            <div className="mt-5">
              <SocialShare
                title={post.title}
                url={typeof window !== 'undefined' ? window.location.href : ''}
              />
            </div>
          </header>

          {/* Featured Image */}
          {post.featured_image && (
            <div className="rounded-2xl overflow-hidden mb-10 relative aspect-video">
              <Image 
                src={post.featured_image} 
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                priority
                className="object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div 
            className={`prose prose-lg max-w-none ${isDark ? 'prose-invert' : ''}`}
            dangerouslySetInnerHTML={{ __html: post.content }}
            data-testid="post-content"
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 pt-8 border-t border-border">
              <div className="flex items-center flex-wrap gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                {post.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className={`px-3 py-1 ${isDark ? 'bg-secondary' : 'bg-slate-100'} rounded-full text-sm text-muted-foreground`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Social Share - Bottom */}
          <div className={`mt-8 pt-8 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}>
            <p className="text-sm text-muted-foreground font-medium">Enjoyed this article? Share it!</p>
            <SocialShare
              title={post.title}
              url={typeof window !== 'undefined' ? window.location.href : ''}
            />
          </div>

          {/* CTA */}
          <div className={`mt-12 ${isDark ? 'bg-card' : 'bg-slate-50'} rounded-2xl p-8 text-center`}>
            <h3 className="text-2xl font-bold text-foreground mb-3">Ready to Get Your Premium Domain?</h3>
            <p className="text-muted-foreground mb-6">Browse our collection of aged domains with high authority.</p>
            <Link href="/domains">
              <Button className={`${isDark ? 'bg-white text-[#0F172A] hover:bg-slate-100' : 'bg-[#0F172A] hover:bg-[#1E293B] text-white'} rounded-full px-8`}>
                Browse Domains
              </Button>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
};

export default BlogPostPage;
