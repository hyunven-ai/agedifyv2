"use client";
import { useState, useEffect } from 'react';
import { Eye, MousePointer, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { getDomainAnalytics } from '../../lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => { loadData(); }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getDomainAnalytics(period);
      setData(res.data);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const periods = [
    { value: '7', label: '7 Days' },
    { value: '30', label: '30 Days' },
    { value: '90', label: '90 Days' },
    { value: '365', label: '1 Year' },
  ];

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="analytics-title">Domain Analytics</h1>
          <p className="text-muted-foreground">Track domain views and contact clicks</p>
        </div>
        <div className="flex gap-2" data-testid="period-selector">
          {periods.map(p => (
            <Button key={p.value} size="sm"
              variant={period === p.value ? 'default' : 'outline'}
              className={`rounded-full ${period === p.value ? 'btn-gradient text-white' : ''}`}
              onClick={() => setPeriod(p.value)}
              data-testid={`period-${p.value}`}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-card rounded-2xl border border-border p-6" data-testid="total-views-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-violet-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">{(data?.total_views || 0).toLocaleString()}</p>
          <p className="text-sm text-muted-foreground font-medium">Total Views</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6" data-testid="total-clicks-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center">
              <MousePointer className="w-6 h-6 text-cyan-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">{(data?.total_clicks || 0).toLocaleString()}</p>
          <p className="text-sm text-muted-foreground font-medium">Total Clicks</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6" data-testid="ctr-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {data?.total_views > 0 ? ((data.total_clicks / data.total_views) * 100).toFixed(1) : '0'}%
          </p>
          <p className="text-sm text-muted-foreground font-medium">Click-Through Rate</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-violet-600" />
          </div>
          <h3 className="text-base font-bold text-foreground">Views & Clicks Over Time</h3>
        </div>
        <div className="h-72" data-testid="analytics-chart">
          {data?.by_date?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.by_date}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)', color: 'hsl(var(--foreground))' }} />
                <Area type="monotone" dataKey="views" stroke="#8b5cf6" fill="url(#colorViews)" strokeWidth={2} name="Views" />
                <Area type="monotone" dataKey="clicks" stroke="#06b6d4" fill="url(#colorClicks)" strokeWidth={2} name="Clicks" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">No analytics data yet for this period</div>
          )}
        </div>
      </div>

      {/* Top Domains Table */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-base font-bold text-foreground mb-4">Most Viewed Domains</h3>
        <div className="overflow-x-auto" data-testid="top-domains-table">
          {data?.top_domains?.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">#</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Domain</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Views</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Clicks</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">CTR</th>
                </tr>
              </thead>
              <tbody>
                {data.top_domains.map((d, i) => (
                  <tr key={d.slug} className="border-b border-border/50 hover:bg-secondary/30 transition-colors" data-testid={`top-domain-row-${i}`}>
                    <td className="p-3">
                      <span className="w-7 h-7 bg-gradient-to-br from-violet-500 to-cyan-500 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                        {i + 1}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-foreground text-sm">{d.domain_name}</td>
                    <td className="p-3 text-right text-sm text-foreground">{d.total_views.toLocaleString()}</td>
                    <td className="p-3 text-right text-sm text-foreground">{d.total_clicks.toLocaleString()}</td>
                    <td className="p-3 text-right text-sm font-semibold text-violet-500">
                      {d.total_views > 0 ? ((d.total_clicks / d.total_views) * 100).toFixed(1) : '0'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Eye className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No analytics data yet. Views will be tracked when visitors browse domain pages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
