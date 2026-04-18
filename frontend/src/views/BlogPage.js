"use client";
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Globe, Search, Calendar, User, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { getPublicBlogPosts, getBlogPostsCount, getPublicCategories } from '../lib/api';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';

const BlogPage = () => {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const postsPerPage = 6;

  useEffect(() => {
    loadData();
  }, [currentPage, searchQuery, selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        skip: (currentPage - 1) * postsPerPage,
        limit: postsPerPage
      };
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category = selectedCategory;

      const [postsRes, countRes, categoriesRes] = await Promise.all([
        getPublicBlogPosts(params),
        getBlogPostsCount(params),
        getPublicCategories()
      ]);

      setPosts(postsRes.data);
      setTotalCount(countRes.data.count);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error loading blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / postsPerPage);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getExcerpt = (content, maxLength = 150) => {
    if (!content) return '';
    const stripped = content.replace(/<[^>]*>/g, '');
    return stripped.length > maxLength ? stripped.substring(0, maxLength) + '...' : stripped;
  };

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
              <Link href="/blog" className="text-foreground font-semibold">Blog</Link>
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

      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-blue-500 tracking-wide uppercase">Our Blog</span>
            <h1 className="mt-3 text-4xl md:text-5xl font-bold text-foreground" data-testid="blog-title">
              Insights & Guides
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Learn about aged domains, SEO strategies, and how to leverage premium domains for your business.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-72 flex-shrink-0 order-2 lg:order-1">
              <div className={`${isDark ? 'bg-card' : 'bg-white'} rounded-2xl shadow-lg p-6 sticky top-24`}>
                {/* Search */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      data-testid="blog-search-input"
                      placeholder="Search articles..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10 h-10 rounded-lg"
                    />
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">Categories</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setSelectedCategory('');
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === '' 
                          ? (isDark ? 'bg-white text-[#0F172A]' : 'bg-[#0F172A] text-white')
                          : 'text-muted-foreground hover:bg-secondary'
                      }`}
                      data-testid="category-all-btn"
                    >
                      All Posts
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center ${
                          selectedCategory === cat.id 
                            ? (isDark ? 'bg-white text-[#0F172A]' : 'bg-[#0F172A] text-white')
                            : 'text-muted-foreground hover:bg-secondary'
                        }`}
                        data-testid={`category-${cat.id}-btn`}
                      >
                        <span>{cat.name}</span>
                        <span className={`text-xs ${selectedCategory === cat.id ? '' : 'text-muted-foreground'}`}>
                          ({cat.post_count})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Posts Grid */}
            <div className="flex-1 order-1 lg:order-2">
              {/* Results Count */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{posts.length}</span> of{' '}
                  <span className="font-semibold text-foreground">{totalCount}</span> articles
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
                </div>
              ) : posts.length === 0 ? (
                <div className={`${isDark ? 'bg-card' : 'bg-white'} rounded-2xl shadow-lg p-12 text-center`}>
                  <p className="text-muted-foreground">No articles found. Check back soon!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {posts.map((post, index) => (
                    <article 
                      key={post.id}
                      className={`${isDark ? 'bg-card' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden card-hover`}
                      data-testid={`blog-post-${index}`}
                    >
                      {post.featured_image && (
                        <div className="aspect-video overflow-hidden relative">
                          <Image 
                            src={post.featured_image} 
                            alt={post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        {post.category && (
                          <span className={`inline-block px-3 py-1 ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'} rounded-full text-xs font-semibold mb-3`}>
                            {post.category.name}
                          </span>
                        )}
                        <h2 className="text-xl font-bold text-foreground mb-3 line-clamp-2">
                          <Link href={`/blog/${post.slug}`} className="hover:text-blue-500 transition-colors">
                            {post.title}
                          </Link>
                        </h2>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                          {post.excerpt || getExcerpt(post.content)}
                        </p>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {post.author}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(post.published_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8" data-testid="pagination">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`rounded-lg w-10 ${currentPage === pageNum ? (isDark ? 'bg-white text-[#0F172A]' : 'bg-[#0F172A]') : ''}`}
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
                    className="rounded-lg"
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

export default BlogPage;
