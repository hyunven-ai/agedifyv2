# Agedify.com - Changelog

## Session 7 (March 11, 2026)
- **Backend Refactoring (P0)**: Completed full refactoring of monolithic `server.py` (1410 lines) into modular structure
- **Domain Wishlist Feature**: localStorage-based wishlist with heart icons, /wishlist page, price tracking
- **Next.js Migration**: Full migration from CRA to Next.js 16 App Router
  - SSR metadata for all public pages (generateMetadata for domain detail + blog posts)
  - File-based routing replacing react-router-dom
  - Server components for metadata, client components for interactivity
  - All contexts updated with SSR-safe localStorage access
- **Internal Link Suggestions**: Backend keyword-matching API + admin UI panel in blog editor
  - Auto-suggests blog posts, domains, and categories based on content keywords
  - Copy-to-clipboard HTML link feature
- **Logo Deduplication**: Confirmed already consolidated in /public
- **Next.js Image Optimization**: All `<img>` tags replaced with `next/image` `<Image>` for logos, blog featured images, and Unsplash images. Automatic lazy loading, responsive sizing, and format optimization.
- **ISR (Incremental Static Regeneration)**: Domain detail (`/domain/[slug]`) and blog post (`/blog/[slug]`) pages use `revalidate=300` and `generateStaticParams` for pre-generation. Domain listing and blog listing pages also have ISR.
- **i18n Support (Indonesian/English)**: LanguageContext with full translation dictionary, `t()` function, LanguageToggle (EN/ID) on all public page navbars. Persists in localStorage. Admin panel intentionally not translated.
- All tests passed: 22/22 backend API + all frontend i18n/image/ISR features verified

## Session 6 (March 11, 2026)
- Hero Section Micro-Interactions & Animated Illustrations
- Scroll-triggered animations for all landing page sections
- Complete UI redesign of DomainsPage, DomainDetailPage
- Added indexed, discount_percentage, language, tld, registrar fields
- Complete Admin Panel Redesign with dark theme
- Hero tagline update

## Session 5 (March 10, 2026)
- Rebranded from MostDomain to Agedify
- Change Password Feature
- Performance Optimization (N+1 queries fix)

## Session 4 (March 3, 2026)
- Image Upload Feature
- Export Contacts to CSV
- Analytics Dashboard
- Multi-currency Support
- Domain Comparison

## Session 3 (March 3, 2026)
- Rich Text Editor (TipTap)
- Tracking Pixel & LiveChat Integration
- WhatsApp & Telegram Widget

## Session 2 (March 3, 2026)
- Complete Blog CMS System
- SEO Features (sitemap, robots.txt, schema markup)

## Session 1 (March 3, 2026)
- Full MVP: Landing Page, Domain Marketplace, Admin Panel
- Domain CRUD with Spam Score
- Contact leads management
