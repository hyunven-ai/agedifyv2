"use client";
import { useState, useEffect } from 'react';
import { Save, Globe, FileText, Code, BarChart3, MessageCircle, MessageSquare } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { toast } from 'sonner';
import { getAdminSEOSettings, updateSEOSettings } from '../../lib/api';

const AdminSEOSettings = () => {
  const [settings, setSettings] = useState({
    site_title: '',
    site_description: '',
    default_meta_title: '',
    default_meta_description: '',
    og_image: '',
    robots_txt: '',
    canonical_base: '',
    google_analytics_id: '',
    facebook_pixel_id: '',
    custom_head_scripts: '',
    custom_body_scripts: '',
    whatsapp_number: '',
    whatsapp_message: '',
    telegram_username: '',
    chat_widget_enabled: true,
    chat_widget_position: 'right'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await getAdminSEOSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSEOSettings(settings);
      toast.success('SEO settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
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
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SEO Settings</h1>
          <p className="text-muted-foreground">Configure global SEO settings for your website</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="btn-gradient text-white rounded-full" data-testid="save-seo-btn">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* General Settings */}
      <div className="bg-card rounded-2xl shadow-lg shadow-slate-200/50 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Globe className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-foreground">General Settings</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Site Title</label>
            <Input
              value={settings.site_title || ''}
              onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
              placeholder="Agedify - Premium Aged Domains"
              className="h-11 rounded-lg"
              data-testid="site-title-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Site Description</label>
            <Textarea
              value={settings.site_description || ''}
              onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
              placeholder="Marketplace for premium aged and expired domains"
              rows={2}
              className="rounded-lg resize-none"
              data-testid="site-description-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Canonical Base URL</label>
            <Input
              value={settings.canonical_base || ''}
              onChange={(e) => setSettings({ ...settings, canonical_base: e.target.value })}
              placeholder="https://agedify.com"
              className="h-11 rounded-lg"
              data-testid="canonical-base-input"
            />
          </div>
        </div>
      </div>

      {/* Meta Defaults */}
      <div className="bg-card rounded-2xl shadow-lg shadow-slate-200/50 p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-foreground">Default Meta Tags</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Default Meta Title Template</label>
            <Input
              value={settings.default_meta_title || ''}
              onChange={(e) => setSettings({ ...settings, default_meta_title: e.target.value })}
              placeholder="{page_title} | Agedify"
              className="h-11 rounded-lg"
              data-testid="meta-title-input"
            />
            <p className="text-xs text-muted-foreground mt-1">Use {'{page_title}'} as placeholder</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Default Meta Description</label>
            <Textarea
              value={settings.default_meta_description || ''}
              onChange={(e) => setSettings({ ...settings, default_meta_description: e.target.value })}
              placeholder="Find premium aged domains at Agedify"
              rows={2}
              className="rounded-lg resize-none"
              data-testid="meta-description-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">OpenGraph Image URL</label>
            <Input
              value={settings.og_image || ''}
              onChange={(e) => setSettings({ ...settings, og_image: e.target.value })}
              placeholder="https://agedify.com/og-image.jpg"
              className="h-11 rounded-lg"
              data-testid="og-image-input"
            />
          </div>
        </div>
      </div>

      {/* Technical SEO */}
      <div className="bg-card rounded-2xl shadow-lg shadow-slate-200/50 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Code className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-foreground">Technical SEO</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Robots.txt Content</label>
            <Textarea
              value={settings.robots_txt || ''}
              onChange={(e) => setSettings({ ...settings, robots_txt: e.target.value })}
              placeholder="User-agent: *&#10;Allow: /&#10;Sitemap: /sitemap.xml"
              rows={6}
              className="rounded-lg resize-none font-mono text-sm"
              data-testid="robots-txt-input"
            />
          </div>
        </div>
      </div>

      {/* Tracking & Analytics */}
      <div className="bg-card rounded-2xl shadow-lg shadow-slate-200/50 p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-semibold text-foreground">Tracking & Analytics</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Google Analytics ID</label>
            <Input
              value={settings.google_analytics_id || ''}
              onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
              placeholder="G-XXXXXXXXXX atau UA-XXXXXXXXX-X"
              className="h-11 rounded-lg"
              data-testid="ga-id-input"
            />
            <p className="text-xs text-muted-foreground mt-1">Masukkan ID Google Analytics 4 (G-) atau Universal Analytics (UA-)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Facebook Pixel ID</label>
            <Input
              value={settings.facebook_pixel_id || ''}
              onChange={(e) => setSettings({ ...settings, facebook_pixel_id: e.target.value })}
              placeholder="1234567890123456"
              className="h-11 rounded-lg"
              data-testid="fb-pixel-input"
            />
            <p className="text-xs text-muted-foreground mt-1">Masukkan Facebook Pixel ID untuk tracking konversi</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Custom Head Scripts</label>
            <Textarea
              value={settings.custom_head_scripts || ''}
              onChange={(e) => setSettings({ ...settings, custom_head_scripts: e.target.value })}
              placeholder="<!-- Tambahkan script tracking lainnya di sini -->&#10;<script>...</script>"
              rows={5}
              className="rounded-lg resize-none font-mono text-sm"
              data-testid="head-scripts-input"
            />
            <p className="text-xs text-muted-foreground mt-1">Script akan ditempatkan di dalam tag &lt;head&gt; (contoh: TikTok Pixel, LinkedIn Insight, dll)</p>
          </div>
        </div>
      </div>

      {/* LiveChat & Custom Scripts */}
      <div className="bg-card rounded-2xl shadow-lg shadow-slate-200/50 p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-foreground">LiveChat & Widget Scripts</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">LiveChat / Widget JavaScript Code</label>
            <Textarea
              value={settings.custom_body_scripts || ''}
              onChange={(e) => setSettings({ ...settings, custom_body_scripts: e.target.value })}
              placeholder="<!-- Paste kode LiveChat di sini -->&#10;<script>&#10;  // Contoh: Tawk.to, Crisp, Intercom, dll&#10;</script>"
              rows={6}
              className="rounded-lg resize-none font-mono text-sm"
              data-testid="body-scripts-input"
            />
            <p className="text-xs text-muted-foreground mt-1">Script akan ditempatkan sebelum &lt;/body&gt; (contoh: Tawk.to, Crisp, Zendesk)</p>
          </div>
        </div>
      </div>

      {/* WhatsApp & Telegram Widget */}
      <div className="bg-card rounded-2xl shadow-lg shadow-slate-200/50 p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-foreground">WhatsApp & Telegram Widget</h2>
        </div>

        <div className="space-y-4">
          {/* Widget Enable Toggle */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div>
              <label className="block text-sm font-medium text-foreground">Aktifkan Chat Widget</label>
              <p className="text-xs text-muted-foreground mt-1">Tampilkan floating button WhatsApp & Telegram</p>
            </div>
            <Switch
              checked={settings.chat_widget_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, chat_widget_enabled: checked })}
              data-testid="widget-enabled-toggle"
            />
          </div>

          {/* Widget Position */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Posisi Widget</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, chat_widget_position: 'left' })}
                className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                  settings.chat_widget_position === 'left' 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                    : 'border-border hover:border-slate-300'
                }`}
              >
                <span className="text-sm font-medium">Kiri Bawah</span>
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, chat_widget_position: 'right' })}
                className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                  settings.chat_widget_position === 'right' 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                    : 'border-border hover:border-slate-300'
                }`}
              >
                <span className="text-sm font-medium">Kanan Bawah</span>
              </button>
            </div>
          </div>

          {/* WhatsApp Settings */}
          <div className="p-4 bg-green-50 rounded-xl space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-green-600">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="font-semibold text-green-700">WhatsApp</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nomor WhatsApp</label>
              <Input
                value={settings.whatsapp_number || ''}
                onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                placeholder="628123456789 (tanpa + atau spasi)"
                className="h-11 rounded-lg bg-card"
                data-testid="whatsapp-number-input"
              />
              <p className="text-xs text-muted-foreground mt-1">Format: kode negara + nomor (contoh: 628123456789)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Pesan Default</label>
              <Textarea
                value={settings.whatsapp_message || ''}
                onChange={(e) => setSettings({ ...settings, whatsapp_message: e.target.value })}
                placeholder="Halo, saya tertarik dengan domain di Agedify"
                rows={2}
                className="rounded-lg resize-none bg-card"
                data-testid="whatsapp-message-input"
              />
              <p className="text-xs text-muted-foreground mt-1">Pesan yang akan otomatis terisi saat pengunjung klik tombol WhatsApp</p>
            </div>
          </div>

          {/* Telegram Settings */}
          <div className="p-4 bg-blue-50 rounded-xl space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-blue-600">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span className="font-semibold text-blue-700">Telegram</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Username Telegram</label>
              <Input
                value={settings.telegram_username || ''}
                onChange={(e) => setSettings({ ...settings, telegram_username: e.target.value })}
                placeholder="@username atau username"
                className="h-11 rounded-lg bg-card"
                data-testid="telegram-username-input"
              />
              <p className="text-xs text-muted-foreground mt-1">Username Telegram Anda (dengan atau tanpa @)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <h3 className="font-semibold text-blue-700 mb-2">Sitemap</h3>
          <p className="text-sm text-blue-600 mb-2">Auto-generated sitemap available at:</p>
          <code className="text-xs bg-blue-100 px-2 py-1 rounded">/api/sitemap.xml</code>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <h3 className="font-semibold text-purple-700 mb-2">Schema Markup</h3>
          <p className="text-sm text-purple-600">Blog posts and domain listings automatically include structured data (JSON-LD).</p>
        </div>
      </div>

      {/* Save Button Mobile */}
      <div className="md:hidden">
        <Button onClick={handleSave} disabled={saving} className="w-full btn-gradient text-white rounded-full">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default AdminSEOSettings;
