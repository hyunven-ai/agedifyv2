import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_data');
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Public APIs
export const getPublicDomains = (params) => api.get('/domains', { params });
export const getDomainsCount = (params) => api.get('/domains/count', { params });
export const getFeaturedDomains = () => api.get('/domains/featured');
export const getDomainBySlug = (slug) => api.get(`/domains/${slug}`);
export const submitContact = (data) => api.post('/contact', data);

// Admin Auth
export const adminLogin = (data) => api.post('/admin/login', data);
export const getAdminMe = () => api.get('/admin/me');

// Admin Domains
export const getAdminDomains = (params) => api.get('/admin/domains', { params });
export const createDomain = (data) => api.post('/admin/domains', data);
export const updateDomain = (id, data) => api.put(`/admin/domains/${id}`, data);
export const deleteDomain = (id) => api.delete(`/admin/domains/${id}`);

// Admin Contacts
export const getAdminContacts = (params) => api.get('/admin/contacts', { params });
export const updateContact = (id, data) => api.put(`/admin/contacts/${id}`, data);
export const deleteContact = (id) => api.delete(`/admin/contacts/${id}`);

// Admin Dashboard
export const getDashboardStats = () => api.get('/admin/dashboard');
export const getAnalytics = () => api.get('/admin/analytics');
export const exportContactsCSV = () => api.get('/admin/contacts/export', { responseType: 'blob' });

// Currencies
export const getCurrencies = () => api.get('/currencies');

// Seed Data
export const seedData = () => api.post('/admin/seed');

// ========== BLOG APIs ==========

// Public Blog
export const getPublicBlogPosts = (params) => api.get('/blog/posts', { params });
export const getBlogPostsCount = (params) => api.get('/blog/posts/count', { params });
export const getBlogPostBySlug = (slug) => api.get(`/blog/posts/${slug}`);
export const getPublicCategories = () => api.get('/blog/categories');
export const getPublicTags = () => api.get('/blog/tags');

// Admin Blog Posts
export const getAdminBlogPosts = (params) => api.get('/admin/blog/posts', { params });
export const getAdminBlogPost = (id) => api.get(`/admin/blog/posts/${id}`);
export const createBlogPost = (data) => api.post('/admin/blog/posts', data);
export const updateBlogPost = (id, data) => api.put(`/admin/blog/posts/${id}`, data);
export const deleteBlogPost = (id) => api.delete(`/admin/blog/posts/${id}`);

// Admin Categories
export const getAdminCategories = () => api.get('/admin/blog/categories');
export const createCategory = (data) => api.post('/admin/blog/categories', data);
export const deleteCategory = (id) => api.delete(`/admin/blog/categories/${id}`);

// Admin Tags
export const getAdminTags = () => api.get('/admin/blog/tags');
export const createTag = (data) => api.post('/admin/blog/tags', data);
export const deleteTag = (id) => api.delete(`/admin/blog/tags/${id}`);

// Admin Password
export const changePassword = (data) => api.put('/admin/change-password', data);

// Admin Management
export const getAdmins = () => api.get('/admin/admins');
export const createAdmin = (data) => api.post('/admin/admins', data);
export const updateAdmin = (id, data) => api.put(`/admin/admins/${id}`, data);
export const deleteAdmin = (id) => api.delete(`/admin/admins/${id}`);

// ========== SEO PAGES APIs ==========

// Public SEO Pages
export const getSEOPageBySlug = (slug) => api.get(`/pages/${slug}`);
export const getPublicSEOPages = () => api.get('/pages');

// Admin SEO Pages
export const getAdminSEOPages = () => api.get('/admin/seo/pages');
export const getAdminSEOPage = (id) => api.get(`/admin/seo/pages/${id}`);
export const createSEOPage = (data) => api.post('/admin/seo/pages', data);
export const updateSEOPage = (id, data) => api.put(`/admin/seo/pages/${id}`, data);
export const deleteSEOPage = (id) => api.delete(`/admin/seo/pages/${id}`);

// SEO Settings
export const getPublicSEOSettings = () => api.get('/seo/settings');
export const getAdminSEOSettings = () => api.get('/admin/seo/settings');
export const updateSEOSettings = (data) => api.put('/admin/seo/settings', data);

// Internal Link Suggestions
export const getInternalLinkSuggestions = (data) => api.post('/admin/blog/link-suggestions', data);

// Admin Gallery
export const getGalleryImages = () => api.get('/admin/gallery');
export const deleteGalleryImage = (filename) => api.delete(`/upload/image/${filename}`);

// Admin CSV Import/Export
export const exportDomainsCSV = () => api.get('/admin/domains/export/csv', { responseType: 'blob' });
export const getCSVTemplate = () => api.get('/admin/domains/template/csv', { responseType: 'blob' });
export const importDomainsCSV = (formData) => api.post('/admin/domains/import/csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// Admin Bulk Operations
export const bulkDeleteDomains = (ids) => api.post('/admin/domains/bulk-delete', { ids });
export const bulkUpdateStatus = (ids, status) => api.post('/admin/domains/bulk-status', { ids, status });

// Analytics Tracking
export const trackDomainView = (slug) => api.post(`/track/view/${slug}`).catch(() => {});
export const trackDomainClick = (slug) => api.post(`/track/click/${slug}`).catch(() => {});

// Admin Analytics
export const getDomainAnalytics = (period) => api.get(`/admin/domain-analytics?period=${period || 30}`);

export default api;
