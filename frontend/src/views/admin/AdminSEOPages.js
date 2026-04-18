"use client";
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Eye, FileCode } from 'lucide-react';
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
  getAdminSEOPages, 
  createSEOPage, 
  updateSEOPage, 
  deleteSEOPage 
} from '../../lib/api';

const AdminSEOPages = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const initialFormState = {
    title: '',
    slug: '',
    headline: '',
    subheadline: '',
    meta_title: '',
    meta_description: '',
    focus_keyword: '',
    content_blocks: [],
    faq_items: [],
    cta_text: '',
    cta_link: '',
    status: 'draft'
  };

  const [formData, setFormData] = useState(initialFormState);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [newContentBlock, setNewContentBlock] = useState({ type: 'text', content: '' });

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const response = await getAdminSEOPages();
      setPages(response.data);
    } catch (error) {
      console.error('Error loading pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (page = null) => {
    if (page) {
      setEditingPage(page);
      setFormData({
        title: page.title,
        slug: page.slug,
        headline: page.headline,
        subheadline: page.subheadline || '',
        meta_title: page.meta_title || '',
        meta_description: page.meta_description || '',
        focus_keyword: page.focus_keyword || '',
        content_blocks: page.content_blocks || [],
        faq_items: page.faq_items || [],
        cta_text: page.cta_text || '',
        cta_link: page.cta_link || '',
        status: page.status
      });
    } else {
      setEditingPage(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPage(null);
    setFormData(initialFormState);
    setNewFaq({ question: '', answer: '' });
    setNewContentBlock({ type: 'text', content: '' });
  };

  const handleAddFaq = () => {
    if (newFaq.question.trim() && newFaq.answer.trim()) {
      setFormData({
        ...formData,
        faq_items: [...formData.faq_items, { ...newFaq }]
      });
      setNewFaq({ question: '', answer: '' });
    }
  };

  const handleRemoveFaq = (index) => {
    setFormData({
      ...formData,
      faq_items: formData.faq_items.filter((_, i) => i !== index)
    });
  };

  const handleAddContentBlock = () => {
    if (newContentBlock.content.trim()) {
      setFormData({
        ...formData,
        content_blocks: [...formData.content_blocks, { ...newContentBlock }]
      });
      setNewContentBlock({ type: 'text', content: '' });
    }
  };

  const handleRemoveContentBlock = (index) => {
    setFormData({
      ...formData,
      content_blocks: formData.content_blocks.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingPage) {
        await updateSEOPage(editingPage.id, formData);
        toast.success('Page updated successfully');
      } else {
        await createSEOPage(formData);
        toast.success('Page created successfully');
      }
      handleCloseModal();
      loadPages();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save page');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSEOPage(id);
      toast.success('Page deleted');
      setDeleteConfirmId(null);
      loadPages();
    } catch (error) {
      toast.error('Failed to delete page');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SEO Pages</h1>
          <p className="text-muted-foreground">Create custom landing pages for SEO</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="btn-gradient text-white rounded-full"
          data-testid="add-page-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Page
        </Button>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-violet-500 border-t-transparent"></div>
          </div>
        ) : pages.length === 0 ? (
          <div className="col-span-full bg-card rounded-2xl shadow-lg p-12 text-center">
            <FileCode className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No SEO Pages Yet</h3>
            <p className="text-muted-foreground mb-4">Create custom landing pages like /buy-aged-domains</p>
            <Button onClick={() => handleOpenModal()} className="btn-gradient text-white rounded-full">
              Create First Page
            </Button>
          </div>
        ) : (
          pages.map((page) => (
            <div key={page.id} className="bg-card rounded-2xl shadow-lg p-6 card-hover">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{page.title}</h3>
                  <p className="text-sm text-blue-600">/{page.slug}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  page.status === 'published' ? 'status-available' : 'status-pending'
                }`}>
                  {page.status}
                </span>
              </div>
              
              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{page.headline}</p>
              
              {page.focus_keyword && (
                <p className="text-xs text-muted-foreground mb-4">
                  Keyword: <span className="font-medium">{page.focus_keyword}</span>
                </p>
              )}

              <div className="flex items-center gap-2 pt-4 border-t">
                {page.status === 'published' && (
                  <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" className="w-full rounded-lg" size="sm">
                      <Eye className="w-4 h-4 mr-1" /> View
                    </Button>
                  </a>
                )}
                <Button
                  variant="outline"
                  onClick={() => handleOpenModal(page)}
                  className="flex-1 rounded-lg"
                  size="sm"
                >
                  <Edit2 className="w-4 h-4 mr-1" /> Edit
                </Button>
                {deleteConfirmId === page.id ? (
                  <div className="flex gap-1">
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(page.id)} className="rounded text-xs">
                      Yes
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDeleteConfirmId(null)} className="rounded">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteConfirmId(page.id)}
                    className="rounded-lg text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Page Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPage ? 'Edit SEO Page' : 'Create SEO Page'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Page Title *</label>
                <Input
                  placeholder="Buy Aged Domains"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="h-11 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">URL Slug *</label>
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-1">/</span>
                  <Input
                    placeholder="buy-aged-domains"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    required
                    className="h-11 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Headline & Subheadline */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Headline *</label>
              <Input
                placeholder="Premium Aged Domains for Your Business"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                required
                className="h-11 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Subheadline</label>
              <Textarea
                placeholder="Find high-authority domains..."
                value={formData.subheadline}
                onChange={(e) => setFormData({ ...formData, subheadline: e.target.value })}
                rows={2}
                className="rounded-lg resize-none"
              />
            </div>

            {/* SEO Settings */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-foreground mb-4">SEO Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Meta Title</label>
                  <Input
                    placeholder="SEO title"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    className="h-11 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Focus Keyword</label>
                  <Input
                    placeholder="aged domains"
                    value={formData.focus_keyword}
                    onChange={(e) => setFormData({ ...formData, focus_keyword: e.target.value })}
                    className="h-11 rounded-lg"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground mb-1">Meta Description</label>
                <Textarea
                  placeholder="Page description for search engines..."
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  rows={2}
                  className="rounded-lg resize-none"
                />
              </div>
            </div>

            {/* Content Blocks */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-foreground mb-4">Content Blocks</h4>
              <div className="space-y-2 mb-4">
                {formData.content_blocks.map((block, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-secondary/50 rounded-lg">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{block.type}</span>
                    <p className="flex-1 text-sm text-muted-foreground line-clamp-2">{block.content}</p>
                    <button type="button" onClick={() => handleRemoveContentBlock(index)} className="text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Select value={newContentBlock.type} onValueChange={(v) => setNewContentBlock({ ...newContentBlock, type: v })}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="heading">Heading</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Block content..."
                  value={newContentBlock.content}
                  onChange={(e) => setNewContentBlock({ ...newContentBlock, content: e.target.value })}
                  className="flex-1 h-10 rounded-lg"
                />
                <Button type="button" onClick={handleAddContentBlock} variant="outline" className="rounded-lg">
                  Add
                </Button>
              </div>
            </div>

            {/* FAQ Items */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-foreground mb-4">FAQ Section</h4>
              <div className="space-y-2 mb-4">
                {formData.faq_items.map((faq, index) => (
                  <div key={index} className="p-3 bg-secondary/50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-foreground">{faq.question}</p>
                        <p className="text-sm text-muted-foreground mt-1">{faq.answer}</p>
                      </div>
                      <button type="button" onClick={() => handleRemoveFaq(index)} className="text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 p-4 bg-secondary/50 rounded-lg">
                <Input
                  placeholder="Question"
                  value={newFaq.question}
                  onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                  className="h-10 rounded-lg"
                />
                <Textarea
                  placeholder="Answer"
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                  rows={2}
                  className="rounded-lg resize-none"
                />
                <Button type="button" onClick={handleAddFaq} variant="outline" className="w-full rounded-lg">
                  <Plus className="w-4 h-4 mr-2" /> Add FAQ
                </Button>
              </div>
            </div>

            {/* CTA */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-foreground mb-4">Call to Action</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">CTA Button Text</label>
                  <Input
                    placeholder="Browse Domains"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    className="h-11 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">CTA Link</label>
                  <Input
                    placeholder="/domains"
                    value={formData.cta_link}
                    onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                    className="h-11 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Status</label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="h-11 rounded-lg w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1 rounded-full">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1 btn-gradient text-white rounded-full">
                {submitting ? 'Saving...' : (editingPage ? 'Update Page' : 'Create Page')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSEOPages;
