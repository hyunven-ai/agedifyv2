"use client";
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Eye, EyeOff, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
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
import { getAdmins, createAdmin, updateAdmin, deleteAdmin } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const AdminManageAdmins = () => {
  const { admin: currentAdmin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({ username: '', password: '', role: 'editor' });

  useEffect(() => { loadAdmins(); }, []);

  const loadAdmins = async () => {
    try {
      const res = await getAdmins();
      setAdmins(res.data);
    } catch {
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (admin = null) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({ username: admin.username, password: '', role: admin.role || 'super_admin' });
    } else {
      setEditingAdmin(null);
      setFormData({ username: '', password: '', role: 'editor' });
    }
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAdmin(null);
    setFormData({ username: '', password: '', role: 'editor' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingAdmin && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      if (editingAdmin) {
        const payload = {};
        if (formData.username !== editingAdmin.username) payload.username = formData.username;
        if (formData.password) payload.password = formData.password;
        if (formData.role !== editingAdmin.role) payload.role = formData.role;
        if (!Object.keys(payload).length) {
          toast.error('No changes detected');
          setSubmitting(false);
          return;
        }
        await updateAdmin(editingAdmin.id, payload);
        toast.success('Admin updated successfully');
      } else {
        await createAdmin({ username: formData.username, password: formData.password, role: formData.role });
        toast.success('Admin created successfully');
      }
      handleCloseModal();
      loadAdmins();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAdmin(id);
      toast.success('Admin deleted successfully');
      setDeleteConfirmId(null);
      loadAdmins();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete admin');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="manage-admins-title">
            Manage Admins
          </h1>
          <p className="text-muted-foreground">Add, edit, or remove administrator accounts</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="btn-gradient text-white rounded-full"
          data-testid="add-admin-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Admin
        </Button>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl shadow-lg shadow-slate-200/50 p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-500/15 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground" data-testid="admin-count">{admins.length}</p>
            <p className="text-sm text-muted-foreground">Total Admins</p>
          </div>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-card rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="admins-table">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Username</th>
                <th className="text-center py-4 px-4 font-semibold text-muted-foreground hidden sm:table-cell">Role</th>
                <th className="text-center py-4 px-4 font-semibold text-muted-foreground hidden md:table-cell">Created</th>
                <th className="text-center py-4 px-6 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent mx-auto"></div>
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>No admins found.</p>
                  </td>
                </tr>
              ) : (
                admins.map((adm, index) => {
                  const isSelf = adm.id === currentAdmin?.id;
                  return (
                    <tr key={adm.id} className="border-b border-border table-row-hover" data-testid={`admin-row-${index}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {adm.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground block">{adm.username}</span>
                            {isSelf && (
                              <span className="text-xs text-violet-500 font-medium">(You)</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-4 px-4 hidden sm:table-cell">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          adm.role === 'super_admin'
                            ? 'bg-violet-50 text-violet-600'
                            : 'bg-cyan-50 text-cyan-600'
                        }`}>
                          {adm.role === 'super_admin' ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                          {adm.role === 'super_admin' ? 'Super Admin' : 'Editor'}
                        </span>
                      </td>
                      <td className="text-center py-4 px-4 text-muted-foreground hidden md:table-cell text-sm">
                        {formatDate(adm.created_at)}
                      </td>
                      <td className="text-center py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenModal(adm)}
                            className="rounded-lg"
                            data-testid={`edit-admin-${index}-btn`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          {isSelf ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="rounded-lg opacity-40 cursor-not-allowed"
                              title="Cannot delete yourself"
                              data-testid={`delete-admin-${index}-btn-disabled`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          ) : deleteConfirmId === adm.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(adm.id)}
                                className="rounded-lg text-xs"
                                data-testid={`confirm-delete-admin-${index}-btn`}
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeleteConfirmId(null)}
                                className="rounded-lg"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeleteConfirmId(adm.id)}
                              className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                              data-testid={`delete-admin-${index}-btn`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Admin Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAdmin ? 'Edit Admin' : 'Create New Admin'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-4" data-testid="admin-form">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Username *</label>
              <Input
                data-testid="admin-username-input"
                placeholder="Enter username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="h-11 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {editingAdmin ? 'New Password (leave blank to keep current)' : 'Password *'}
              </label>
              <div className="relative">
                <Input
                  data-testid="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={editingAdmin ? 'Leave blank to keep current' : 'Min. 6 characters'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingAdmin}
                  minLength={formData.password ? 6 : undefined}
                  className="h-11 rounded-lg pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Role *</label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="h-11 rounded-lg" data-testid="admin-role-select">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.role === 'super_admin'
                  ? 'Full access to all features'
                  : 'Access to Blog, Categories, Gallery, and Password only'}
              </p>
            </div>

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
                data-testid="save-admin-btn"
              >
                {submitting ? 'Saving...' : (editingAdmin ? 'Update Admin' : 'Create Admin')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminManageAdmins;
