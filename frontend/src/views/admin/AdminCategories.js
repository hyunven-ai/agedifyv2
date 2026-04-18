"use client";
import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Tag, FolderOpen } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import { 
  getAdminCategories, 
  createCategory, 
  deleteCategory,
  getAdminTags,
  createTag,
  deleteTag
} from '../../lib/api';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newTag, setNewTag] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, tagsRes] = await Promise.all([
        getAdminCategories(),
        getAdminTags()
      ]);
      setCategories(categoriesRes.data);
      setTags(tagsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;

    try {
      await createCategory(newCategory);
      toast.success('Category created');
      setNewCategory({ name: '', description: '' });
      loadData();
    } catch (error) {
      toast.error('Failed to create category');
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteCategory(id);
      toast.success('Category deleted');
      setDeleteConfirmId(null);
      loadData();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (!newTag.trim()) return;

    try {
      await createTag({ name: newTag.trim() });
      toast.success('Tag created');
      setNewTag('');
      loadData();
    } catch (error) {
      toast.error('Failed to create tag');
    }
  };

  const handleDeleteTag = async (id) => {
    try {
      await deleteTag(id);
      toast.success('Tag deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete tag');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-violet-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Categories & Tags</h1>
        <p className="text-muted-foreground">Organize your blog content</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Categories */}
        <div className="bg-card rounded-2xl shadow-lg shadow-slate-200/50 p-6">
          <div className="flex items-center gap-2 mb-6">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-foreground">Categories</h2>
          </div>

          {/* Add Category Form */}
          <form onSubmit={handleCreateCategory} className="mb-6 p-4 bg-secondary/50 rounded-xl">
            <div className="space-y-3">
              <Input
                placeholder="Category name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="h-10 rounded-lg"
                data-testid="category-name-input"
              />
              <Textarea
                placeholder="Description (optional)"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                rows={2}
                className="rounded-lg resize-none"
              />
              <Button type="submit" className="w-full btn-gradient text-white rounded-lg" data-testid="add-category-btn">
                <Plus className="w-4 h-4 mr-2" /> Add Category
              </Button>
            </div>
          </form>

          {/* Categories List */}
          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No categories yet</p>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <span className="font-medium text-foreground">{cat.name}</span>
                    <span className="ml-2 text-sm text-muted-foreground">({cat.post_count} posts)</span>
                    {cat.description && (
                      <p className="text-sm text-muted-foreground mt-1">{cat.description}</p>
                    )}
                  </div>
                  {deleteConfirmId === cat.id ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="rounded text-xs"
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteConfirmId(null)}
                        className="rounded"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteConfirmId(cat.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="bg-card rounded-2xl shadow-lg shadow-slate-200/50 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Tag className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-foreground">Tags</h2>
          </div>

          {/* Add Tag Form */}
          <form onSubmit={handleCreateTag} className="mb-6 flex gap-2">
            <Input
              placeholder="New tag name"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="h-10 rounded-lg"
              data-testid="tag-name-input"
            />
            <Button type="submit" className="btn-gradient text-white rounded-lg" data-testid="add-tag-btn">
              <Plus className="w-4 h-4" />
            </Button>
          </form>

          {/* Tags List */}
          <div className="flex flex-wrap gap-2">
            {tags.length === 0 ? (
              <p className="text-muted-foreground">No tags yet</p>
            ) : (
              tags.map((tag) => (
                <span 
                  key={tag.id} 
                  className="inline-flex items-center px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm"
                >
                  {tag.name}
                  <span className="mx-1 text-purple-400">({tag.post_count})</span>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="ml-1 text-purple-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;
