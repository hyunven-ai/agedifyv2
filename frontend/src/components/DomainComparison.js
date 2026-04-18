"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Scale, TrendingUp, Shield, Link2, Clock, DollarSign, FileDown, Share2, Check, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';

const DomainComparison = ({ domains, onRemove, onClose }) => {
  const { formatPrice } = useCurrency();
  const { isDark } = useTheme();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  if (!domains || domains.length === 0) return null;

  const metrics = [
    { key: 'dr', label: 'Domain Rating', icon: TrendingUp, format: (v) => v, best: 'high' },
    { key: 'da', label: 'Domain Authority', icon: Scale, format: (v) => v, best: 'high' },
    { key: 'pa', label: 'Page Authority', icon: Scale, format: (v) => v ?? 0, best: 'high' },
    { key: 'spam_score', label: 'Spam Score', icon: Shield, format: (v) => v, best: 'low' },
    { key: 'backlinks', label: 'Backlinks', icon: Link2, format: (v) => v?.toLocaleString(), best: 'high' },
    { key: 'traffic', label: 'Traffic', icon: TrendingUp, format: (v) => v?.toLocaleString(), best: 'high' },
    { key: 'age', label: 'Age (Years)', icon: Clock, format: (v) => v, best: 'high' },
    { key: 'price', label: 'Price', icon: DollarSign, format: (v) => formatPrice(v), best: 'low' },
  ];

  const getBestValue = (key, best) => {
    const values = domains.map(d => d[key] || 0);
    return best === 'high' ? Math.max(...values) : Math.min(...values);
  };

  const isBest = (domain, key, best) => {
    return (domain[key] || 0) === getBestValue(key, best);
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const el = document.getElementById('compare-modal-table');
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();

      pdf.setFontSize(18);
      pdf.text('Agedify - Domain Comparison', 10, 15);
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 10, 22);

      const imgW = pageW - 20;
      const imgH = (canvas.height * imgW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 28, imgW, Math.min(imgH, 160));

      const names = domains.map(d => d.domain_name.replace(/\./g, '_')).join('_vs_');
      pdf.save(`agedify_compare_${names}.pdf`);
      toast.success('PDF exported!');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const openFullPage = () => {
    const slugs = domains.map(d => d.slug).join(',');
    router.push(`/compare?domains=${slugs}`);
    onClose();
  };

  const shareLink = () => {
    const slugs = domains.map(d => d.slug).join(',');
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.clipboard.writeText(`${base}/compare?domains=${slugs}`);
    setLinkCopied(true);
    toast.success('Compare link copied!');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`${isDark ? 'bg-[#0F172A]' : 'bg-white'} rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <Scale className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Domain Comparison</h2>
              <p className="text-sm text-muted-foreground">Comparing {domains.length} domains</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full hidden sm:flex" onClick={shareLink} data-testid="modal-share-btn">
              {linkCopied ? <Check className="w-4 h-4 mr-1" /> : <Share2 className="w-4 h-4 mr-1" />}
              {linkCopied ? 'Copied!' : 'Share'}
            </Button>
            <Button variant="outline" size="sm" className="rounded-full hidden sm:flex" onClick={exportPDF} disabled={exporting} data-testid="modal-export-pdf-btn">
              <FileDown className="w-4 h-4 mr-1" />
              {exporting ? 'Exporting...' : 'PDF'}
            </Button>
            <Button variant="outline" size="sm" className="rounded-full hidden sm:flex" onClick={openFullPage} data-testid="modal-full-page-btn">
              <ExternalLink className="w-4 h-4 mr-1" /> Full Page
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto" id="compare-modal-table">
          <table className="w-full">
            <thead>
              <tr className={isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
                <th className="text-left p-4 font-medium text-muted-foreground w-40">Metric</th>
                {domains.map((domain) => (
                  <th key={domain.id} className="p-4 min-w-[180px]">
                    <div className="flex flex-col items-center gap-2">
                      <span className="font-bold text-foreground text-sm truncate max-w-full">{domain.domain_name}</span>
                      <button onClick={() => onRemove(domain.id)} className="text-xs text-red-500 hover:text-red-600 hover:underline">Remove</button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, index) => (
                <tr key={metric.key} className={`border-t border-border ${index % 2 === 0 ? '' : isDark ? 'bg-slate-800/30' : 'bg-slate-50/50'}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <metric.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{metric.label}</span>
                    </div>
                  </td>
                  {domains.map((domain) => {
                    const best = isBest(domain, metric.key, metric.best);
                    return (
                      <td key={domain.id} className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold ${
                          best ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700') : 'text-foreground'
                        }`}>
                          {metric.format(domain[metric.key])}
                          {best && domains.length > 1 && ' \u2713'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-t border-border">
                <td className="p-4"><span className="text-sm font-medium text-foreground">Status</span></td>
                {domains.map((domain) => (
                  <td key={domain.id} className="p-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      domain.status === 'available'
                        ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
                        : (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700')
                    }`}>{domain.status === 'available' ? 'Available' : 'Sold'}</span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" className="rounded-full sm:hidden" onClick={shareLink}>
            <Share2 className="w-4 h-4 mr-1" /> Share
          </Button>
          <Button variant="outline" size="sm" className="rounded-full sm:hidden" onClick={exportPDF} disabled={exporting}>
            <FileDown className="w-4 h-4 mr-1" /> PDF
          </Button>
          <Button variant="outline" onClick={onClose} className="rounded-full">Close</Button>
        </div>
      </div>
    </div>
  );
};

export default DomainComparison;
