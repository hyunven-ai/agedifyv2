"use client";
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getPublicSEOSettings } from '../lib/api';

const TrackingScripts = () => {
  const [settings, setSettings] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await getPublicSEOSettings();
        setSettings(response.data);
      } catch (error) {
        console.error('Error loading tracking settings:', error);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!settings) return;

    // Skip title override for dynamic pages with SSR metadata
    const isDynamicPage = pathname.startsWith('/domain/') || pathname.startsWith('/blog/');
    if (isDynamicPage) {
      // Only update og tags and description, not the title (SSR handles it)
    } else {
      const pageTitles = {
        '/': 'Home',
        '/domains': 'Browse Domains',
        '/blog': 'Blog',
        '/admin': 'Admin Dashboard',
      };

      let pageTitle = pageTitles[pathname] || '';
      if (pathname.startsWith('/admin/')) pageTitle = 'Admin';

      if (settings.default_meta_title && pageTitle) {
        document.title = settings.default_meta_title.replace('{page_title}', pageTitle);
      } else if (settings.site_title) {
        document.title = pageTitle ? `${pageTitle} | ${settings.site_title}` : settings.site_title;
      }
    }

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    const descContent = pathname === '/'
      ? (settings.site_description || settings.default_meta_description)
      : (settings.default_meta_description || settings.site_description);
    if (descContent) metaDescription.content = descContent;

    let ogImage = document.querySelector('meta[property="og:image"]');
    if (settings.og_image) {
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
      }
      ogImage.content = settings.og_image;
    }

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.content = document.title;

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.content = descContent || '';
  }, [settings, pathname]);

  useEffect(() => {
    if (!settings) return;

    if (settings.google_analytics_id) {
      const gaId = settings.google_analytics_id;
      if (!document.querySelector(`script[src*="googletagmanager.com/gtag"]`)) {
        const gaScript = document.createElement('script');
        gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        gaScript.async = true;
        document.head.appendChild(gaScript);
        const gaInit = document.createElement('script');
        gaInit.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`;
        document.head.appendChild(gaInit);
      }
    }

    if (settings.facebook_pixel_id) {
      const pixelId = settings.facebook_pixel_id;
      if (!document.querySelector('script[data-fb-pixel]')) {
        const fbScript = document.createElement('script');
        fbScript.setAttribute('data-fb-pixel', 'true');
        fbScript.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`;
        document.head.appendChild(fbScript);
      }
    }

    if (settings.custom_head_scripts && !document.querySelector('script[data-custom-head]')) {
      const customHead = document.createElement('div');
      customHead.innerHTML = settings.custom_head_scripts;
      customHead.querySelectorAll('script').forEach(script => {
        const newScript = document.createElement('script');
        if (script.src) { newScript.src = script.src; newScript.async = true; }
        else { newScript.innerHTML = script.innerHTML; }
        newScript.setAttribute('data-custom-head', 'true');
        document.head.appendChild(newScript);
      });
    }

    if (settings.custom_body_scripts && !document.querySelector('script[data-custom-body]')) {
      const customBody = document.createElement('div');
      customBody.innerHTML = settings.custom_body_scripts;
      customBody.querySelectorAll('script').forEach(script => {
        const newScript = document.createElement('script');
        if (script.src) { newScript.src = script.src; newScript.async = true; }
        else { newScript.innerHTML = script.innerHTML; }
        newScript.setAttribute('data-custom-body', 'true');
        document.body.appendChild(newScript);
      });
      customBody.querySelectorAll(':not(script)').forEach(el => {
        if (el.tagName !== 'DIV' || el.innerHTML.trim()) {
          const clone = el.cloneNode(true);
          clone.setAttribute('data-custom-body', 'true');
          document.body.appendChild(clone);
        }
      });
    }
  }, [settings]);

  return null;
};

export default TrackingScripts;
