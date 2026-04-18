"use client";
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, CheckCircle, XCircle, Download, Upload, FileSpreadsheet, CheckSquare, Square, AlertTriangle } from 'lucide-react';
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
import { getAdminDomains, createDomain, updateDomain, deleteDomain, exportDomainsCSV, getCSVTemplate, importDomainsCSV, bulkDeleteDomains, bulkUpdateStatus } from '../../lib/api';

const AdminDomains = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkConfirm, setBulkConfirm] = useState(null);

  const initialFormState = {
    domain_name: '',
    dr: '',
    da: '',
    pa: '',
    spam_score: '',
    backlinks: '',
    traffic: '',
    age: '',
    price: '',
    discount_percentage: '',
    indexed: '',
    language: '',
    tld: '',
    registrar: '',
    status: 'available',
    description: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      const response = await getAdminDomains({ limit: 100 });
      setDomains(response.data);
    } catch (error) {
      console.error('Error loading domains:', error);
      toast.error('Failed to load domains');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await exportDomainsCSV();
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agedify_domains_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported successfully');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await getCSVTemplate();
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'agedify_import_template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download template');
    }
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await importDomainsCSV(formData);
      toast.success(res.data.message);
      if (res.data.errors?.length > 0) {
        toast.error(`${res.data.errors.length} errors during import`);
      }
      loadDomains();
    } catch {
      toast.error('Import failed');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredDomains.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDomains.map(d => d.id));
    }
  };

  const handleBulkDelete = async () => {
    try {
      const res = await bulkDeleteDomains(selectedIds);
      toast.success(res.data.message);
      setSelectedIds([]);
      setBulkConfirm(null);
      loadDomains();
    } catch {
      toast.error('Bulk delete failed');
    }
  };

  const handleBulkStatus = async (newStatus) => {
    try {
      const res = await bulkUpdateStatus(selectedIds, newStatus);
      toast.success(res.data.message);
      setSelectedIds([]);
      setBulkConfirm(null);
      loadDomains();
    } catch {
      toast.error('Bulk status update failed');
    }
  };

  const handleOpenModal = (domain = null) => {
    if (domain) {
      setEditingDomain(domain);
      setFormData({
        domain_name: domain.domain_name,
        dr: domain.dr.toString(),
        da: domain.da.toString(),
        pa: (domain.pa ?? 0).toString(),
        spam_score: (domain.spam_score ?? 0).toString(),
        backlinks: domain.backlinks.toString(),
        traffic: domain.traffic.toString(),
        age: domain.age.toString(),
        price: domain.price.toString(),
        discount_percentage: (domain.discount_percentage ?? 0).toString(),
        indexed: (domain.indexed ?? 0).toString(),
        language: domain.language || '',
        tld: domain.tld || '',
        registrar: domain.registrar || '',
        status: domain.status,
        description: domain.description || ''
      });
    } else {
      setEditingDomain(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDomain(null);
    setFormData(initialFormState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      domain_name: formData.domain_name,
      dr: parseInt(formData.dr),
      da: parseInt(formData.da),
      pa: parseInt(formData.pa) || 0,
      spam_score: parseInt(formData.spam_score) || 0,
      backlinks: parseInt(formData.backlinks),
      traffic: parseInt(formData.traffic),
      age: parseInt(formData.age),
      price: parseFloat(formData.price),
      discount_percentage: parseFloat(formData.discount_percentage) || 0,
      indexed: parseInt(formData.indexed) || 0,
      language: formData.language || '',
      tld: formData.tld || '',
      registrar: formData.registrar || '',
      status: formData.status,
      description: formData.description || null
    };

    try {
      if (editingDomain) {
        await updateDomain(editingDomain.id, payload);
        toast.success('Domain updated successfully');
      } else {
        await createDomain(payload);
        toast.success('Domain created successfully');
      }
      handleCloseModal();
      loadDomains();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save domain');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDomain(id);
      toast.success('Domain deleted successfully');
      setDeleteConfirmId(null);
      loadDomains();
    } catch (error) {
      toast.error('Failed to delete domain');
    }
  };

  const filteredDomains = domains.filter(domain =>
    domain.domain_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="domains-title">Manage Domains</h1>
          <p className="text-muted-foreground">Add, edit, or remove domain listings</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="rounded-full" onClick={handleDownloadTemplate} data-testid="download-template-btn">
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Template
          </Button>
          <label className="cursor-pointer" data-testid="import-csv-label">
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
            <Button asChild variant="outline" size="sm" className="rounded-full" disabled={importing}>
              <span>
                <Upload className="w-4 h-4 mr-1" />
                {importing ? 'Importing...' : 'Import CSV'}
              </span>
            </Button>
          </label>
          <Button variant="outline" size="sm" className="rounded-full" onClick={handleExportCSV} data-testid="export-csv-btn">
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
          <Button
            onClick={() => handleOpenModal()}
            className="btn-gradient text-white rounded-full"
            data-testid="add-domain-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Domain
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-testid="search-domains-input"
          placeholder="Search domains..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 rounded-lg"
        />
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 bg-violet-500/10 border border-violet-500/20 rounded-xl px-5 py-3" data-testid="bulk-actions-bar">
          <span className="text-sm font-semibold text-foreground">{selectedIds.length} selected</span>
          <div className="h-5 w-px bg-border" />
          <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => handleBulkStatus('available')} data-testid="bulk-set-available">
            <CheckCircle className="w-3 h-3 mr-1" /> Set Available
          </Button>
          <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => handleBulkStatus('sold')} data-testid="bulk-set-sold">
            <XCircle className="w-3 h-3 mr-1" /> Set Sold
          </Button>
          <Button size="sm" variant="destructive" className="rounded-full text-xs" onClick={() => setBulkConfirm('delete')} data-testid="bulk-delete-btn">
            <Trash2 className="w-3 h-3 mr-1" /> Delete Selected
          </Button>
          <Button size="sm" variant="ghost" className="rounded-full text-xs" onClick={() => setSelectedIds([])} data-testid="bulk-clear-btn">
            <X className="w-3 h-3 mr-1" /> Clear
          </Button>
        </div>
      )}

      {/* Bulk Delete Confirm Dialog */}
      {bulkConfirm === 'delete' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setBulkConfirm(null)}>
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Confirm Bulk Delete</h3>
                <p className="text-sm text-muted-foreground">Delete {selectedIds.length} domains permanently?</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-full" onClick={() => setBulkConfirm(null)}>Cancel</Button>
              <Button variant="destructive" className="rounded-full" onClick={handleBulkDelete} data-testid="bulk-delete-confirm">Delete All</Button>
            </div>
          </div>
        </div>
      )}

      {/* Domains Table */}
      <div className="bg-card rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="admin-domains-table">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="py-4 px-3 w-10">
                  <button onClick={toggleSelectAll} className="flex items-center justify-center" data-testid="select-all-checkbox">
                    {selectedIds.length === filteredDomains.length && filteredDomains.length > 0
                      ? <CheckSquare className="w-5 h-5 text-violet-500" />
                      : <Square className="w-5 h-5 text-muted-foreground" />
                    }
                  </button>
                </th>
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Domain</th>
                <th className="text-center py-4 px-3 font-semibold text-muted-foreground">DR</th>
                <th className="text-center py-4 px-3 font-semibold text-muted-foreground">DA</th>
                <th className="text-center py-4 px-3 font-semibold text-muted-foreground">PA</th>
                <th className="text-center py-4 px-3 font-semibold text-muted-foreground">SS</th>
                <th className="text-center py-4 px-3 font-semibold text-muted-foreground hidden md:table-cell">Backlinks</th>
                <th className="text-center py-4 px-3 font-semibold text-muted-foreground hidden lg:table-cell">Indexed</th>
                <th className="text-center py-4 px-3 font-semibold text-muted-foreground hidden lg:table-cell">Age</th>
                <th className="text-right py-4 px-4 font-semibold text-muted-foreground">Price</th>
                <th className="text-center py-4 px-4 font-semibold text-muted-foreground">Status</th>
                <th className="text-center py-4 px-6 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="12" className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent mx-auto"></div>
                  </td>
                </tr>
              ) : filteredDomains.length === 0 ? (
                <tr>
                  <td colSpan="12" className="text-center py-12 text-muted-foreground">
                    {searchQuery ? 'No domains found matching your search.' : 'No domains yet. Add your first domain!'}
                  </td>
                </tr>
              ) : (
                filteredDomains.map((domain, index) => (
                  <tr key={domain.id} className={`border-b border-border table-row-hover ${selectedIds.includes(domain.id) ? 'bg-violet-500/5' : ''}`} data-testid={`domain-row-${index}`}>
                    <td className="py-4 px-3">
                      <button onClick={() => toggleSelect(domain.id)} className="flex items-center justify-center" data-testid={`select-domain-${index}`}>
                        {selectedIds.includes(domain.id)
                          ? <CheckSquare className="w-5 h-5 text-violet-500" />
                          : <Square className="w-5 h-5 text-muted-foreground" />
                        }
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-foreground">{domain.domain_name}</span>
                    </td>
                    <td className="text-center py-4 px-3">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-sm">
                        {domain.dr}
                      </span>
                    </td>
                    <td className="text-center py-4 px-3">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-700 font-bold text-sm">
                        {domain.da}
                      </span>
                    </td>
                    <td className="text-center py-4 px-3">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50 text-purple-700 font-bold text-sm">
                        {domain.pa ?? 0}
                      </span>
                    </td>
                    <td className="text-center py-4 px-3">
                      <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm ${
                        (domain.spam_score ?? 0) <= 5 ? 'bg-emerald-50 text-emerald-700' :
                        (domain.spam_score ?? 0) <= 15 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {domain.spam_score ?? 0}
                      </span>
                    </td>
                    <td className="text-center py-4 px-3 text-muted-foreground hidden md:table-cell">
                      {domain.backlinks?.toLocaleString()}
                    </td>
                    <td className="text-center py-4 px-3 text-muted-foreground hidden lg:table-cell">
                      {(domain.indexed ?? 0) > 0 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 text-emerald-600"><CheckCircle className="w-4 h-4" /></span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-50 text-red-500"><XCircle className="w-4 h-4" /></span>
                      )}
                    </td>
                    <td className="text-center py-4 px-3 text-muted-foreground hidden lg:table-cell">
                      {domain.age} yrs
                    </td>
                    <td className="text-right py-4 px-4">
                      {(domain.discount_percentage ?? 0) > 0 ? (
                        <div>
                          <span className="text-xs text-muted-foreground line-through block">${domain.price?.toLocaleString()}</span>
                          <span className="font-bold text-foreground">${(domain.price * (1 - domain.discount_percentage / 100)).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                          <span className="ml-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">-{domain.discount_percentage}%</span>
                        </div>
                      ) : (
                        <span className="font-bold text-foreground">${domain.price?.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        domain.status === 'available' ? 'status-available' : 'status-sold'
                      }`}>
                        {domain.status === 'available' ? 'Available' : 'Sold'}
                      </span>
                    </td>
                    <td className="text-center py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenModal(domain)}
                          className="rounded-lg"
                          data-testid={`edit-domain-${index}-btn`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {deleteConfirmId === domain.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(domain.id)}
                              className="rounded-lg text-xs"
                              data-testid={`confirm-delete-${index}-btn`}
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
                            onClick={() => setDeleteConfirmId(domain.id)}
                            className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`delete-domain-${index}-btn`}
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

      {/* Add/Edit Domain Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDomain ? 'Edit Domain' : 'Add New Domain'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4" data-testid="domain-form">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Domain Name</label>
              <Input
                data-testid="domain-name-input"
                placeholder="example.com"
                value={formData.domain_name}
                onChange={(e) => setFormData({ ...formData, domain_name: e.target.value })}
                required
                className="h-11 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">DR (0-100)</label>
                <Input
                  data-testid="domain-dr-input"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={formData.dr}
                  onChange={(e) => setFormData({ ...formData, dr: e.target.value })}
                  required
                  className="h-11 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">DA (0-100)</label>
                <Input
                  data-testid="domain-da-input"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={formData.da}
                  onChange={(e) => setFormData({ ...formData, da: e.target.value })}
                  required
                  className="h-11 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">PA (0-100)</label>
                <Input
                  data-testid="domain-pa-input"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={formData.pa}
                  onChange={(e) => setFormData({ ...formData, pa: e.target.value })}
                  className="h-11 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">SS (0-100)</label>
                <Input
                  data-testid="domain-ss-input"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={formData.spam_score}
                  onChange={(e) => setFormData({ ...formData, spam_score: e.target.value })}
                  className="h-11 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Backlinks</label>
                <Input
                  data-testid="domain-backlinks-input"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.backlinks}
                  onChange={(e) => setFormData({ ...formData, backlinks: e.target.value })}
                  required
                  className="h-11 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Est. Traffic</label>
                <Input
                  data-testid="domain-traffic-input"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.traffic}
                  onChange={(e) => setFormData({ ...formData, traffic: e.target.value })}
                  required
                  className="h-11 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Age (Years)</label>
                <Input
                  data-testid="domain-age-input"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  required
                  className="h-11 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Indexed Pages</label>
                <Input
                  data-testid="domain-indexed-input"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.indexed}
                  onChange={(e) => setFormData({ ...formData, indexed: e.target.value })}
                  className="h-11 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Price ($)</label>
                <Input
                  data-testid="domain-price-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="h-11 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Discount (%)</label>
                <Input
                  data-testid="domain-discount-input"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="0"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                  className="h-11 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Language</label>
                <Input
                  data-testid="domain-language-input"
                  placeholder="e.g. English"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="h-11 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">TLD</label>
                <Input
                  data-testid="domain-tld-input"
                  placeholder="e.g. .com"
                  value={formData.tld}
                  onChange={(e) => setFormData({ ...formData, tld: e.target.value })}
                  className="h-11 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Registrar</label>
                <Input
                  data-testid="domain-registrar-input"
                  placeholder="e.g. GoDaddy"
                  value={formData.registrar}
                  onChange={(e) => setFormData({ ...formData, registrar: e.target.value })}
                  className="h-11 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="h-11 rounded-lg" data-testid="domain-status-select">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Description</label>
              <Textarea
                data-testid="domain-description-input"
                placeholder="Brief description of the domain..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="rounded-lg resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
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
                data-testid="save-domain-btn"
              >
                {submitting ? 'Saving...' : (editingDomain ? 'Update Domain' : 'Add Domain')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDomains;
