"use client";
import { useState, useEffect } from 'react';
import { Globe, DollarSign, CheckCircle, Mail, Package, TrendingUp, FileText, BarChart3 } from 'lucide-react';
import { getDashboardStats, seedData, getAnalytics } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [statsRes, analyticsRes] = await Promise.all([getDashboardStats(), getAnalytics()]);
      setStats(statsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const response = await seedData();
      toast.success(response.data.message);
      loadData();
    } catch (error) {
      toast.error('Failed to seed data');
    } finally {
      setSeeding(false);
    }
  };

  const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444'];

  const statCards = [
    { label: 'Total Domains', value: stats?.total_domains || 0, icon: Globe, gradient: 'from-violet-500 to-violet-600', bg: 'bg-violet-500/10', text: 'text-violet-600' },
    { label: 'Available', value: stats?.available_domains || 0, icon: Package, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
    { label: 'Sold', value: stats?.sold_domains || 0, icon: CheckCircle, gradient: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-500/10', text: 'text-cyan-600' },
    { label: 'Revenue', value: `$${(analytics?.total_revenue || 0).toLocaleString()}`, icon: DollarSign, gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-500/10', text: 'text-amber-600' },
    { label: 'Contacts', value: stats?.total_contacts || 0, icon: Mail, gradient: 'from-rose-500 to-rose-600', bg: 'bg-rose-500/10', text: 'text-rose-600' },
    { label: 'Blog Posts', value: stats?.total_blog_posts || 0, icon: FileText, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-500/10', text: 'text-blue-600' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your overview.</p>
        </div>
        <Button onClick={handleSeedData} disabled={seeding}
          className="btn-gradient text-white rounded-xl shadow-lg shadow-violet-500/20"
          data-testid="seed-data-btn"
        >
          {seeding ? 'Seeding...' : 'Seed Sample Data'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((stat, index) => (
          <div key={stat.label} className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 group" data-testid={`stat-card-${index}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-6 h-6 ${stat.text}`} />
              </div>
              <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${stat.gradient} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
            <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contacts Over Time */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-violet-600" />
            </div>
            <h3 className="text-base font-bold text-foreground">Contacts (Last 30 Days)</h3>
          </div>
          <div className="h-64">
            {analytics?.contacts_by_date?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.contacts_by_date}>
                  <defs>
                    <linearGradient id="colorContacts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)', color: 'hsl(var(--foreground))' }} />
                  <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="url(#colorContacts)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No contact data yet</div>
            )}
          </div>
        </div>

        {/* Domains by Status */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-cyan-600" />
            </div>
            <h3 className="text-base font-bold text-foreground">Domains by Status</h3>
          </div>
          <div className="h-64">
            {analytics?.domains_by_status?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics.domains_by_status} cx="50%" cy="50%" innerRadius={65} outerRadius={85} dataKey="count" nameKey="status"
                    label={({ status, count }) => `${status}: ${count}`} strokeWidth={0}>
                    {analytics.domains_by_status.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No domain data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Top Domains & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Domains */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-base font-bold text-foreground mb-4">Top Domains by Price</h3>
          <div className="space-y-3">
            {analytics?.top_domains?.length > 0 ? (
              analytics.top_domains.map((domain, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl hover:bg-violet-500/10 transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-gradient-to-br from-violet-500 to-cyan-500 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{domain.domain_name}</p>
                      <p className="text-xs text-muted-foreground">DR: {domain.dr}</p>
                    </div>
                  </div>
                  <span className="font-bold text-violet-400">${domain.price.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No domains yet</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-base font-bold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/admin/domains', icon: Globe, label: 'Manage Domains', iconClass: 'bg-violet-500/15 text-violet-400' },
              { href: '/admin/contacts', icon: Mail, label: 'View Contacts', iconClass: 'bg-cyan-500/15 text-cyan-400' },
              { href: '/admin/blog', icon: FileText, label: 'Blog Posts', iconClass: 'bg-amber-500/15 text-amber-400' },
              { href: '/', icon: TrendingUp, label: 'View Website', iconClass: 'bg-emerald-500/15 text-emerald-400', external: true },
            ].map((action) => (
              <a key={action.label} href={action.href} target={action.external ? '_blank' : undefined} className="block group">
                <div className="border-2 border-border hover:border-violet-500/30 rounded-xl p-4 text-center transition-all duration-200 group-hover:bg-violet-500/5 group-hover:shadow-md">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform ${action.iconClass}`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-foreground text-sm">{action.label}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
