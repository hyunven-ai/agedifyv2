"use client";
import { useState, useEffect, useCallback } from 'react';
import { Link2, FileText, Globe, FolderOpen, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { getInternalLinkSuggestions } from '../lib/api';

const typeConfig = {
  blog: { icon: FileText, label: 'Blog Post', color: 'text-blue-400 bg-blue-500/15 border-blue-500/20' },
  domain: { icon: Globe, label: 'Domain', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/20' },
  category: { icon: FolderOpen, label: 'Category', color: 'text-violet-400 bg-violet-500/15 border-violet-500/20' },
};

const InternalLinkSuggestions = ({ content, title, currentPostId }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(null);

  const fetchSuggestions = useCallback(async () => {
    if (!content && !title) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await getInternalLinkSuggestions({
        content,
        title,
        current_post_id: currentPostId || null,
      });
      setSuggestions(res.data.suggestions || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [content, title, currentPostId]);

  useEffect(() => {
    const timer = setTimeout(fetchSuggestions, 1500);
    return () => clearTimeout(timer);
  }, [fetchSuggestions]);

  const handleCopy = (suggestion) => {
    const html = `<a href="${suggestion.url}">${suggestion.title}</a>`;
    navigator.clipboard.writeText(html).then(() => {
      setCopiedUrl(suggestion.url);
      toast.success('Link HTML copied to clipboard');
      setTimeout(() => setCopiedUrl(null), 2000);
    });
  };

  if (!content && !title) return null;

  return (
    <div className="border-t pt-4" data-testid="internal-link-suggestions">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="w-4 h-4 text-violet-400" />
        <h4 className="font-semibold text-foreground text-sm">Internal Link Suggestions</h4>
        {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
      </div>

      {suggestions.length === 0 && !loading && (
        <p className="text-xs text-muted-foreground">No matching internal links found. Add more content to get suggestions.</p>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {suggestions.map((s, i) => {
            const config = typeConfig[s.type] || typeConfig.blog;
            const Icon = config.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:border-violet-500/30 hover:bg-accent/5 transition-all group"
                data-testid={`link-suggestion-${i}`}
              >
                <span className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center border ${config.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.url} &middot; {s.matched_keywords.join(', ')}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="flex-shrink-0 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleCopy(s)}
                  title="Copy link HTML"
                  data-testid={`copy-link-${i}`}
                >
                  {copiedUrl === s.url ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InternalLinkSuggestions;
