# Agedify.com - Product Requirements Document

## Original Problem Statement
Build Agedify.com - a professional marketplace for premium aged & expired domains for SEO purposes.

## Architecture
- **Frontend**: Next.js 16 App Router + Tailwind CSS + Shadcn UI (SSR/ISR enabled)
- **Backend**: FastAPI + MongoDB (Motor async driver) - Modular structure
- **Authentication**: JWT-based admin authentication with bcrypt password hashing
- **i18n**: Indonesian/English with localStorage persistence (LanguageContext)
- **Charts**: Recharts for analytics visualization

## Core Features

### Public Pages (SSR/ISR)
- Landing Page: Hero, Benefits, Featured Domains, How It Works, About, FAQ, Contact, Footer - ALL TRANSLATED EN/ID
- Domain Marketplace: advanced filters (PA, Traffic, Backlinks, TLD, Language), saved filters (localStorage), quick presets
- Domain Detail page with SSR metadata, ISR, analytics tracking (views)
- Domain Comparison page (/compare) with PDF export, shareable links
- Blog pages with SSR metadata and ISR
- Wishlist (localStorage-based)
- i18n toggle (EN/ID) on all public pages
- Next.js Image optimization

### Admin Panel (Client-side)
- Secure admin login, Dashboard
- Domain CRUD + Bulk Import/Export CSV
- Contact leads + CSV export
- Blog Posts with Internal Link Suggestions, Categories, Tags
- SEO Pages Builder + SEO Settings
- Image Gallery with upload, copy URL, delete, gallery picker in blog editor
- Domain Analytics Dashboard (views, clicks, CTR, charts, top domains)
- Manage Admins: CRUD with role-based access (Super Admin vs Editor)
- Role Management: Super Admin (full access) vs Editor (Blog, Categories, Gallery, Password only)
- Change Password

## Backend API Endpoints
```
POST /api/admin/login               - Admin login
GET  /api/admin/dashboard/stats     - Dashboard stats
GET  /api/admin/admins              - List all admins (no passwords)
POST /api/admin/admins              - Create new admin
PUT  /api/admin/admins/{id}         - Update admin username/password
DELETE /api/admin/admins/{id}       - Delete admin (self-delete prevented)
GET  /api/admin/domains/export/csv  - Export all domains as CSV
GET  /api/admin/domains/template/csv - Download CSV import template
POST /api/admin/domains/import/csv  - Bulk import domains from CSV
GET  /api/admin/gallery             - List uploaded images
GET  /api/admin/domain-analytics    - Analytics dashboard data
POST /api/admin/blog/link-suggestions - Internal link suggestions for blog editor
POST /api/track/view/{slug}         - Track domain page view (public)
POST /api/track/click/{slug}        - Track buy/contact click (public)
GET  /api/domains                   - List domains with advanced filters
GET  /api/domains/count             - Count with same filters
GET  /api/domains/{slug}            - Domain detail
```

## Credentials
- **Admin**: username: `admin`, password: `admin123`

## Completed (Session 2026-03-11)
- [x] Fixed ImageUpload.js bug: drag & drop always visible
- [x] Domain Comparison with PDF export, share link, /compare page
- [x] Advanced Search: PA, Traffic, Backlinks, TLD, Language filters
- [x] Saved Filters (localStorage) with save/load/delete + Quick Presets
- [x] Admin Image Gallery + Gallery picker in blog editor
- [x] Fixed dropdown TLD/Language dark theme styling
- [x] Complete i18n: Nav, Benefits, How It Works, About, FAQ, Contact, Footer - all translated EN/ID
- [x] Bulk Domain Import/Export CSV (export, import, template download)
- [x] Domain Analytics Dashboard (views, clicks, CTR, time chart, top domains)
- [x] Analytics tracking on domain detail page (view + click events)
- [x] Cleanup package.json: removed react-scripts, react-router-dom, react-helmet-async, cra-template, @craco, browserslist, dead CRA files
- [x] Admin Dark/Light Mode Toggle in sidebar (synced with ThemeContext)
- [x] Admin Bulk Actions: Select All, individual select, bulk delete (with confirmation), bulk status update (Available/Sold)
- [x] Custom Theme Presets: 5 colors (Violet, Blue, Emerald, Rose, Amber) applied site-wide via CSS custom properties, persisted in localStorage
- [x] All features tested: iteration_17 - 100% pass (8 backend + all frontend)
- [x] DevTools Guard: Blocks F12, Ctrl+Shift+I/J/C, Ctrl+U, right-click on public pages; admin pages unaffected
- [x] DevTools Guard tested: iteration_18 - 100% pass (17/17 frontend tests)
- [x] JSON-LD Schema: WebSite+Organization (landing), Product (domain detail), Article (blog post) - SSR rendered
- [x] Blog Social Sharing: WhatsApp, X, Facebook, LinkedIn, Copy Link buttons (top + bottom of article)
- [x] JSON-LD + Social Share tested: iteration_19 - 100% pass (14 backend + 15 frontend)
- [x] Deployment Fix: Renamed src/pages/ to src/views/, SSR-safe contexts, removed CRA leftovers, fixed start script, build succeeds

## Completed (Session 2026-03-13)
- [x] P1: Manage Admins UI - Full CRUD (create, edit, delete) with backend API + frontend page at /admin/manage-admins
- [x] P1: Manage Admins - Self-delete prevention, duplicate username validation, password hashing
- [x] P2: Internal Link Suggestions verified working - suggestions for blog/domain/category in blog editor
- [x] All features tested: iteration_20 - 100% pass (20 backend + all frontend)

## Completed (Session 2026-03-13 - Role Management)
- [x] Admin Role Management: Super Admin vs Editor roles
- [x] Backend: role field in admin model, require_super_admin dependency for protected endpoints
- [x] Backend: All sensitive endpoints (domains, contacts, SEO, analytics, manage admins, dashboard, CSV) restricted to super_admin
- [x] Backend: Editor can access blog, categories, tags, gallery, change password
- [x] Backend: Self-demotion prevention (super admin can't demote themselves)
- [x] Frontend: Sidebar dynamically filtered by role (superOnly flag)
- [x] Frontend: Editor login redirects to /admin/blog, Super Admin to /admin
- [x] Frontend: Manage Admins shows role badges + role dropdown in create/edit form
- [x] Frontend: User info shows role label (Super Admin / Editor)
- [x] Migration: Existing admins auto-migrated to super_admin role on startup
- [x] All features tested: iteration_21 - 100% pass (26 backend + all frontend)

## Completed (Session 2026-03-14 - Deployment Fix)
- [x] Critical Fix: Resolved production 520 error caused by stale preview URLs baked into Next.js routes-manifest.json
- [x] next.config.js rewrites now always proxy /api/* to http://localhost:8001 (not env vars)
- [x] server-api.js SSR fetches always use http://localhost:8001 directly
- [x] Rebuilt Next.js app - routes-manifest.json confirmed clean (no stale URLs)
- [x] All tested: iteration_22 - 100% pass (19 backend + all frontend, health, SSR, admin auth)

## Bug Fix (Session 2026-03-14)
- [x] Fixed: Blog image upload URL validation error "Masukkan URL" — changed input type from "url" to "text" in ImageUpload.js

## Completed (Session 2026-03-15 - Live Currency Rates)
- [x] Auto-updating exchange rates: Backend fetches live rates from open.er-api.com on startup
- [x] Rates cached in MongoDB (settings collection), auto-refresh every 24 hours via background task
- [x] Fallback to last cached rates if API unavailable
- [x] /api/currencies returns live rates with last_updated timestamp and source info
- [x] Supported currencies: USD, IDR (Rp16,935), EUR, GBP, SGD — all live rates
- [x] All tested: iteration_23 - 100% pass (12 backend + 8 frontend)

## Created (Session 2026-03-15)
- [x] Railway Deployment Guide: /app/RAILWAY_DEPLOY_GUIDE.md
- [x] Updated next.config.js: rewrites use INTERNAL_BACKEND_URL env var (Railway compatible) with localhost fallback

## Prioritized Backlog

### P0 - Immediate
- [ ] Frontend Accessibility Audit (WCAG) — carried over

### P1 - High Priority
- [ ] Payment gateway integration (Stripe/Midtrans)
- [ ] Email notifications for new contacts

### P2 - Medium Priority
- [x] Domain detail page SEO schema markup (JSON-LD)
- [x] Blog post social sharing buttons
- [x] Manage Admins CRUD UI
- [x] Internal Link Suggestions for blog

### P3 - Low Priority
- [ ] Domain watchlist email alerts
- [ ] Admin activity log / audit trail
