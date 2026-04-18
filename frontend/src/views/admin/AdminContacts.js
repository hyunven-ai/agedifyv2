"use client";
import { useState, useEffect } from 'react';
import { Mail, Trash2, CheckCircle, Clock, X, Eye, Search, Download } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { toast } from 'sonner';
import { getAdminContacts, updateContact, deleteContact, exportContactsCSV } from '../../lib/api';

const AdminContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    loadContacts();
  }, [statusFilter]);

  const loadContacts = async () => {
    try {
      const params = { limit: 100 };
      if (statusFilter) params.status = statusFilter;
      const response = await getAdminContacts(params);
      setContacts(response.data);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateContact(id, { status });
      toast.success(`Contact marked as ${status}`);
      loadContacts();
      if (selectedContact?.id === id) {
        setSelectedContact({ ...selectedContact, status });
      }
    } catch (error) {
      toast.error('Failed to update contact');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteContact(id);
      toast.success('Contact deleted successfully');
      setDeleteConfirmId(null);
      loadContacts();
    } catch (error) {
      toast.error('Failed to delete contact');
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await exportContactsCSV();
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Contacts exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export contacts');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="contacts-title">Contact Leads</h1>
          <p className="text-muted-foreground">View and manage contact form submissions</p>
        </div>
        <Button
          onClick={handleExportCSV}
          disabled={exporting || contacts.length === 0}
          variant="outline"
          className="rounded-full"
          data-testid="export-csv-btn"
        >
          <Download className="w-4 h-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="search-contacts-input"
            placeholder="Search contacts..."
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
            data-testid="filter-all-btn"
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'pending' ? 'bg-amber-500 text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary'
            }`}
            data-testid="filter-pending-btn"
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('replied')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'replied' ? 'bg-emerald-500 text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary'
            }`}
            data-testid="filter-replied-btn"
          >
            Replied
          </button>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-card rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="contacts-table">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Name</th>
                <th className="text-left py-4 px-4 font-semibold text-muted-foreground">Email</th>
                <th className="text-left py-4 px-4 font-semibold text-muted-foreground hidden lg:table-cell">Message</th>
                <th className="text-center py-4 px-4 font-semibold text-muted-foreground">Status</th>
                <th className="text-center py-4 px-4 font-semibold text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-center py-4 px-6 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent mx-auto"></div>
                  </td>
                </tr>
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-muted-foreground">
                    {searchQuery || statusFilter ? 'No contacts found matching your criteria.' : 'No contact submissions yet.'}
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact, index) => (
                  <tr key={contact.id} className="border-b border-border table-row-hover" data-testid={`contact-row-${index}`}>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-foreground">{contact.name}</span>
                    </td>
                    <td className="py-4 px-4">
                      <a href={`mailto:${contact.email}`} className="text-blue-600 hover:text-blue-700">
                        {contact.email}
                      </a>
                    </td>
                    <td className="py-4 px-4 hidden lg:table-cell">
                      <p className="text-muted-foreground truncate max-w-xs">{contact.message}</p>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        contact.status === 'pending' ? 'status-pending' : 'status-replied'
                      }`}>
                        {contact.status === 'pending' ? (
                          <><Clock className="w-3 h-3 mr-1" /> Pending</>
                        ) : (
                          <><CheckCircle className="w-3 h-3 mr-1" /> Replied</>
                        )}
                      </span>
                    </td>
                    <td className="text-center py-4 px-4 text-muted-foreground hidden md:table-cell text-sm">
                      {formatDate(contact.created_at)}
                    </td>
                    <td className="text-center py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedContact(contact)}
                          className="rounded-lg"
                          data-testid={`view-contact-${index}-btn`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {contact.status === 'pending' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(contact.id, 'replied')}
                            className="rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            data-testid={`mark-replied-${index}-btn`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(contact.id, 'pending')}
                            className="rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            data-testid={`mark-pending-${index}-btn`}
                          >
                            <Clock className="w-4 h-4" />
                          </Button>
                        )}
                        {deleteConfirmId === contact.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(contact.id)}
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
                            onClick={() => setDeleteConfirmId(contact.id)}
                            className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`delete-contact-${index}-btn`}
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

      {/* Contact Detail Modal */}
      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
          </DialogHeader>
          
          {selectedContact && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{selectedContact.name}</p>
                    <a href={`mailto:${selectedContact.email}`} className="text-sm text-blue-600 hover:text-blue-700">
                      {selectedContact.email}
                    </a>
                  </div>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedContact.status === 'pending' ? 'status-pending' : 'status-replied'
                }`}>
                  {selectedContact.status === 'pending' ? 'Pending' : 'Replied'}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Message</label>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-foreground whitespace-pre-wrap">{selectedContact.message}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Submitted</label>
                <p className="text-foreground">{formatDate(selectedContact.created_at)}</p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <a href={`mailto:${selectedContact.email}`} className="flex-1">
                  <Button variant="outline" className="w-full rounded-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Reply via Email
                  </Button>
                </a>
                {selectedContact.status === 'pending' ? (
                  <Button
                    onClick={() => handleUpdateStatus(selectedContact.id, 'replied')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Replied
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleUpdateStatus(selectedContact.id, 'pending')}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 rounded-full"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Mark as Pending
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminContacts;
