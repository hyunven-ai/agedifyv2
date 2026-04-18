"use client";
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Eye, FileText } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { toast } from 'sonner';
import { 
  getAdminBlogPosts, 
  createBlogPost, 
  updateBlogPost, 
  deleteBlogPost,
  getAdminCategories,
  getAdminTags
} from '../../lib/api';
import RichTextEditor from '../../components/RichTextEditor';
import ImageUpload from '../../components/ImageUpload';
import InternalLinkSuggestions from '../../components/InternalLinkSuggestions';

const AdminBlog = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const initialFormState = {
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    meta_title: '',
    meta_description: '',
    focus_keyword: '',
    featured_image: '',
    category_id: '',
    tags: [],
    author: 'Admin',
    status: 'draft'
  };

  const [formData, setFormData] = useState(initialFormState);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      
      const [postsRes, categoriesRes, tagsRes] = await Promise.all([
        getAdminBlogPosts(params),
        getAdminCategories(),
        getAdminTags()
      ]);

      setPosts(postsRes.data);
      setCategories(categoriesRes.data);
      setTags(tagsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (post = null) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt || '',
        meta_title: post.meta_title || '',
        meta_description: post.meta_description || '',
        focus_keyword: post.focus_keyword || '',
        featured_image: post.featured_image || '',
        category_id: post.category_id || '',
        tags: post.tags || [],
        author: post.author,
        status: post.status
      });
    } else {
      setEditingPost(null);
      setFormData(initialFormState);
    }
    setTagInput('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPost(null);
    setFormData(initialFormState);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagToRemove) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        category_id: formData.category_id || null
      };

      if (editingPost) {
        await updateBlogPost(editingPost.id, payload);
        toast.success('Post updated successfully');
      } else {
        await createBlogPost(payload);
        toast.success('Post created successfully');
      }
      handleCloseModal();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBlogPost(id);
      toast.success('Post deleted successfully');
      setDeleteConfirmId(null);
      loadData();
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="blog-title">Blog Manager</h1>
          <p className="text-muted-foreground">Create and manage blog posts for SEO</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="btn-gradient text-white rounded-full"
          data-testid="add-post-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="search-posts-input"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-lg"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === '' ? 'btn-gradient text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'draft' ? 'bg-amber-500 text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary'
            }`}
          >
            Draft
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'published' ? 'bg-emerald-500 text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary'
            }`}
          >
            Published
          </button>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-card rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="posts-table">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Title</th>
                <th className="text-center py-4 px-4 font-semibold text-muted-foreground hidden md:table-cell">Category</th>
                <th className="text-center py-4 px-4 font-semibold text-muted-foreground">Status</th>
                <th className="text-center py-4 px-4 font-semibold text-muted-foreground hidden lg:table-cell">Date</th>
                <th className="text-center py-4 px-6 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent mx-auto"></div>
                  </td>
                </tr>
              ) : filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>No posts yet. Create your first blog post!</p>
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post, index) => (
                  <tr key={post.id} className="border-b border-border table-row-hover" data-testid={`post-row-${index}`}>
                    <td className="py-4 px-6">
                      <div>
                        <span className="font-semibold text-foreground block">{post.title}</span>
                        <span className="text-sm text-muted-foreground">/{post.slug}</span>
                      </div>
                    </td>
                    <td className="text-center py-4 px-4 hidden md:table-cell">
                      {post.category ? (
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-sm">
                          {post.category.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        post.status === 'published' ? 'status-available' : 'status-pending'
                      }`}>
                        {post.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="text-center py-4 px-4 text-muted-foreground hidden lg:table-cell text-sm">
                      {formatDate(post.published_at || post.created_at)}
                    </td>
                    <td className="text-center py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        {post.status === 'published' && (
                          <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="rounded-lg">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenModal(post)}
                          className="rounded-lg"
                          data-testid={`edit-post-${index}-btn`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {deleteConfirmId === post.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(post.id)}
                              className="rounded-lg text-xs"
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeleteConfirmId(null)}
                              className="rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteConfirmId(post.id)}
                            className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`delete-post-${index}-btn`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Post Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Edit Post' : 'Create New Post'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 mt-4" data-testid="post-form">
            {/* Title & Slug */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
                <Input
                  data-testid="post-title-input"
                  placeholder="Post title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="h-11 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">URL Slug</label>
                <Input
                  data-testid="post-slug-input"
                  placeholder="custom-url-slug (auto-generated if empty)"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="h-11 rounded-lg"
                />
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Content *</label>
              <RichTextEditor
                content={formData.content}
                onChange={(html) => setFormData({ ...formData, content: html })}
                placeholder="Write your blog post content..."
              />
            </div>

            {/* Internal Link Suggestions */}
            <InternalLinkSuggestions
              content={formData.content}
              title={formData.title}
              currentPostId={editingPost?.id}
            />

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Excerpt</label>
              <Textarea
                data-testid="post-excerpt-input"
                placeholder="Short description for previews..."
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={2}
                className="rounded-lg resize-none"
              />
            </div>

            {/* SEO Fields */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-foreground mb-4">SEO Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Meta Title</label>
                  <Input
                    data-testid="post-meta-title-input"
                    placeholder="SEO title (max 60 chars)"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    maxLength={60}
                    className="h-11 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Focus Keyword</label>
                  <Input
                    data-testid="post-keyword-input"
                    placeholder="Main keyword to target"
                    value={formData.focus_keyword}
                    onChange={(e) => setFormData({ ...formData, focus_keyword: e.target.value })}
                    className="h-11 rounded-lg"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground mb-1">Meta Description</label>
                <Textarea
                  data-testid="post-meta-desc-input"
                  placeholder="SEO description (max 160 chars)"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  maxLength={160}
                  rows={2}
                  className="rounded-lg resize-none"
                />
              </div>
            </div>

            {/* Category & Featured Image */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                <Select
                  value={formData.category_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger className="h-11 rounded-lg">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Featured Image</label>
                <ImageUpload
                  value={formData.featured_image}
                  onChange={(url) => setFormData({ ...formData, featured_image: url })}
                  placeholder="Upload featured image"
                  maxSize={5}
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Tags</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="h-10 rounded-lg"
                />
                <Button type="button" onClick={handleAddTag} variant="outline" className="rounded-lg">
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 bg-secondary rounded-full text-sm">
                      {tag}
                      <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-2 text-muted-foreground hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Author & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Author</label>
                <Input
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="h-11 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="h-11 rounded-lg" data-testid="post-status-select">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                className="flex-1 rounded-full"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 btn-gradient text-white rounded-full"
                data-testid="save-post-btn"
              >
                {submitting ? 'Saving...' : (editingPost ? 'Update Post' : 'Create Post')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlog;
