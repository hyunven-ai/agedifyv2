"use client";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Scale, ArrowLeft, FileDown, Share2, Check, Globe } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';
import ThemeToggle from '../../components/ThemeToggle';
import { toast } from 'sonner';
import api from '../../lib/api';

const ComparePage = () => {
  const searchParams = useSearchParams();
  const { isDark } = useTheme();
  const { formatPrice } = useCurrency();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const slugs = searchParams.get('domains')?.split(',').filter(Boolean) || [];
    if (slugs.length >= 2) {
      loadDomains(slugs);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const loadDomains = async (slugs) => {
    try {
      const results = await Promise.all(slugs.map(slug => api.get(`/domains/${slug}`)));
      setDomains(results.map(r => r.data));
    } catch {
      toast.error('Failed to load domains');
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    { key: 'dr', label: 'Domain Rating (DR)', best: 'high', format: v => v ?? 0 },
    { key: 'da', label: 'Domain Authority (DA)', best: 'high', format: v => v ?? 0 },
    { key: 'pa', label: 'Page Authority (PA)', best: 'high', format: v => v ?? 0 },
    { key: 'spam_score', label: 'Spam Score', best: 'low', format: v => v ?? 0 },
    { key: 'backlinks', label: 'Backlinks', best: 'high', format: v => (v ?? 0).toLocaleString() },
    { key: 'traffic', label: 'Traffic', best: 'high', format: v => (v ?? 0).toLocaleString() },
    { key: 'age', label: 'Age (Years)', best: 'high', format: v => v ?? 0 },
    { key: 'price', label: 'Price', best: 'low', format: v => formatPrice(v ?? 0) },
    { key: 'indexed', label: 'Indexed Pages', best: 'high', format: v => (v ?? 0).toLocaleString() },
  ];

  const getBest = (key, best) => {
    const vals = domains.map(d => d[key] || 0);
    return best === 'high' ? Math.max(...vals) : Math.min(...vals);
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const el = document.getElementById('comparison-table');
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW - 20;
      const imgH = (canvas.height * imgW) / canvas.width;

      pdf.setFontSize(18);
      pdf.text('Agedify - Domain Comparison', 10, 15);
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 10, 22);

      const startY = 28;
      if (imgH + startY > pageH - 10) {
        const fitH = pageH - startY - 10;
        const fitW = (canvas.width * fitH) / canvas.height;
        pdf.addImage(imgData, 'PNG', 10, startY, fitW, fitH);
      } else {
        pdf.addImage(imgData, 'PNG', 10, startY, imgW, imgH);
      }

      const slugs = domains.map(d => d.domain_name.replace(/\./g, '_')).join('_vs_');
      pdf.save(`agedify_compare_${slugs}.pdf`);
      toast.success('PDF exported!');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const shareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    toast.success('Compare link copied!');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (domains.length < 2) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Scale className="w-16 h-16 text-muted-foreground opacity-30" />
        <h2 className="text-xl font-bold text-foreground">No Domains to Compare</h2>
        <p className="text-muted-foreground">Select at least 2 domains from the marketplace to compare.</p>
        <Link href="/domains">
          <Button className="btn-gradient text-white rounded-full">Browse Domains</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-4">
            <Link href="/" className="flex items-center">
              <Image src="/logo-agedify.png" alt="Agedify" width={224} height={56} priority className="h-14 w-auto" />
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/domains">
                <Button variant="outline" size="sm" className="rounded-full">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-28 pb-16 max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-xl ${isDark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
                <Scale className={`w-5 h-5 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="compare-title">Domain Comparison</h1>
            </div>
            <p className="text-muted-foreground">Comparing {domains.length} domains side by side</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-full" onClick={shareLink} data-testid="share-compare-btn">
              {linkCopied ? <Check className="w-4 h-4 mr-1" /> : <Share2 className="w-4 h-4 mr-1" />}
              {linkCopied ? 'Copied!' : 'Share'}
            </Button>
            <Button size="sm" className="btn-gradient text-white rounded-full" onClick={exportPDF} disabled={exporting} data-testid="export-pdf-btn">
              <FileDown className="w-4 h-4 mr-1" />
              {exporting ? 'Exporting...' : 'Export PDF'}
            </Button>
          </div>
        </div>

        <div id="comparison-table" className={`rounded-2xl overflow-hidden border ${isDark ? 'bg-[#0F172A] border-white/10' : 'bg-white border-slate-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="comparison-table">
              <thead>
                <tr className={isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
                  <th className="text-left p-4 font-semibold text-muted-foreground w-48 text-sm">Metric</th>
                  {domains.map((d) => (
                    <th key={d.id} className="p-4 min-w-[180px]">
                      <Link href={`/domain/${d.slug}`} className="font-bold text-foreground hover:text-violet-500 transition-colors text-sm">
                        {d.domain_name}
                      </Link>
                      <p className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${
                        d.status === 'available'
                          ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
                          : (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700')
                      }`}>{d.status}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((m, i) => (
                  <tr key={m.key} className={`border-t ${isDark ? 'border-white/5' : 'border-slate-100'} ${i % 2 ? (isDark ? 'bg-slate-800/20' : 'bg-slate-50/50') : ''}`}>
                    <td className="p-4 text-sm font-medium text-foreground">{m.label}</td>
                    {domains.map((d) => {
                      const val = d[m.key] || 0;
                      const best = val === getBest(m.key, m.best) && domains.length > 1;
                      return (
                        <td key={d.id} className="p-4 text-center">
                          <span className={`inline-block px-3 py-1.5 rounded-xl text-sm font-bold ${
                            best
                              ? (isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border border-emerald-200')
                              : 'text-foreground'
                          }`}>
                            {m.format(val)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparePage;
