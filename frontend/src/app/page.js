import LandingPage from '@/views/LandingPage';

export const metadata = {
  title: 'Agedify - Premium Aged Domains Marketplace',
  description: 'Discover premium aged and expired domains with established authority, backlinks, and traffic. Your shortcut to SEO success starts here.',
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Agedify",
  "url": siteUrl,
  "description": "Premium aged domains marketplace for SEO professionals. Buy high-authority expired domains with established backlinks and traffic.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${siteUrl}/domains?search={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Agedify",
  "url": siteUrl,
  "logo": `${siteUrl}/logo-agedify.png`,
  "description": "Premium aged domains marketplace. We offer verified aged and expired domains with high domain authority, established backlinks, and organic traffic.",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "sales",
    "availableLanguage": ["English", "Indonesian"]
  },
  "sameAs": []
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <LandingPage />
    </>
  );
}
