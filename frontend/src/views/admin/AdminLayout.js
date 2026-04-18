"use client";
import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Globe, LayoutDashboard, Globe2, Mail, LogOut, Menu, X, ChevronRight, FileText, FolderOpen, FileCode, Settings, Key, ExternalLink, Images, BarChart3, Sun, Moon, Users } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';

const AdminLayout = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logout } = useAuth();
  const { isDark, toggleTheme, preset, changePreset, presets } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isSuperAdmin = admin?.role === 'super_admin';

  const allMenuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true, superOnly: true },
    { path: '/admin/domains', icon: Globe2, label: 'Manage Domains', superOnly: true },
    { path: '/admin/contacts', icon: Mail, label: 'Contact Leads', superOnly: true },
    { path: '/admin/blog', icon: FileText, label: 'Blog Posts' },
    { path: '/admin/categories', icon: FolderOpen, label: 'Categories & Tags' },
    { path: '/admin/seo-pages', icon: FileCode, label: 'SEO Pages', superOnly: true },
    { path: '/admin/seo-settings', icon: Settings, label: 'SEO Settings', superOnly: true },
    { path: '/admin/gallery', icon: Images, label: 'Image Gallery' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Domain Analytics', superOnly: true },
    { path: '/admin/manage-admins', icon: Users, label: 'Manage Admins', superOnly: true },
    { path: '/admin/password', icon: Key, label: 'Change Password' },
  ];

  const menuItems = allMenuItems.filter(item => !item.superOnly || isSuperAdmin);

  const isActive = (path, exact = false) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/admin/login');
  };

  const SidebarContent = ({ mobile = false }) => (
    <>
      {/* Logo */}
      <div className="h-[72px] flex items-center justify-between px-6 border-b border-white/10">
        <Link href="/" className="flex items-center">
          <Image src="/logo-agedify.png" alt="Agedify" width={160} height={40} priority className="h-10 w-auto" />
        </Link>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Menu</p>
        {menuItems.map((item) => {
          const active = isActive(item.path, item.exact);
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={mobile ? () => setSidebarOpen(false) : undefined}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                active
                  ? 'bg-gradient-to-r from-violet-600/20 to-cyan-600/10 text-white border border-violet-500/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                active ? 'bg-violet-500/20' : 'group-hover:bg-white/5'
              }`}>
                <item.icon className={`w-4 h-4 ${active ? 'text-violet-400' : ''}`} />
              </div>
              <span className="font-medium text-sm">{item.label}</span>
              {active && <ChevronRight className="w-4 h-4 ml-auto text-violet-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Dark Mode Toggle */}
      <div className="px-4 py-3 border-t border-white/10">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-200"
          data-testid="admin-theme-toggle"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5">
              {isDark ? <Moon className="w-4 h-4 text-violet-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </div>
            <span className="font-medium text-sm">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <div className={`w-10 h-5 rounded-full transition-colors duration-300 flex items-center ${isDark ? 'bg-violet-600 justify-end' : 'bg-slate-600 justify-start'}`}>
            <div className="w-4 h-4 bg-white rounded-full mx-0.5 shadow-sm" />
          </div>
        </button>

        {/* Theme Presets */}
        <div className="mt-2 px-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 block">Theme Color</span>
          <div className="flex gap-2" data-testid="theme-presets">
            {Object.entries(presets).map(([id, p]) => (
              <button
                key={id}
                onClick={() => changePreset(id)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white transition-all duration-200 ${
                  preset === id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: p.primary }}
                title={p.name}
                data-testid={`preset-color-${id}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center space-x-3 px-3 py-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
            <span className="text-white font-bold text-sm">
              {admin?.username?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{admin?.username || 'Admin'}</p>
            <p className="text-xs text-slate-500">{admin?.role === 'super_admin' ? 'Super Admin' : 'Editor'}</p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full mt-1 text-slate-400 hover:text-white hover:bg-red-500/10 rounded-xl justify-start text-sm h-10"
          data-testid="logout-btn"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:w-[260px] admin-sidebar flex-col fixed inset-y-0 left-0 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] admin-sidebar flex flex-col animate-slide-in-right">
            <SidebarContent mobile />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-[260px]">
        {/* Top Bar */}
        <header className="h-16 admin-sidebar border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-40">
          <button
            className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors"
            onClick={() => setSidebarOpen(true)}
            data-testid="mobile-menu-btn"
          >
            <Menu className="w-5 h-5 text-white/80" />
          </button>

          <div className="flex items-center space-x-4 ml-auto">
            <Link href="/" target="_blank" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-white/10">
              <ExternalLink className="w-4 h-4" />
              View Site
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
