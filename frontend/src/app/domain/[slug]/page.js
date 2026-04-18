import DomainDetailPage from '@/views/DomainDetailPage';
import { getServerApiUrl } from '@/lib/server-api';

export const revalidate = 300;

async function getDomain(slug) {
  try {
    const apiUrl = getServerApiUrl();
    const res = await fetch(`${apiUrl}/api/domains/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const domain = await getDomain(slug);
  if (!domain) return { title: 'Domain Not Found | Agedify' };
  return {
    title: `${domain.domain_name} - DR ${domain.dr} | Agedify`,
    description: `Buy ${domain.domain_name} - Domain Rating ${domain.dr}, Domain Authority ${domain.da}, ${domain.age} years old. ${domain.description || 'Premium aged domain available now.'}`,
    openGraph: {
      title: `${domain.domain_name} - Premium Aged Domain`,
      description: `DR ${domain.dr} | DA ${domain.da} | ${domain.backlinks} Backlinks | ${domain.age} Years Old`,
    },
  };
}

export async function generateStaticParams() {
  try {
    const apiUrl = getServerApiUrl();
    const res = await fetch(`${apiUrl}/api/domains?limit=100`);
    if (!res.ok) return [];
    const domains = await res.json();
    return domains.map((d) => ({ slug: d.slug }));
  } catch {
    return [];
  }
}

export default async function DomainDetail({ params }) {
  const { slug } = await params;
  const domain = await getDomain(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

  const productSchema = domain ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": domain.domain_name,
    "description": domain.description || `Premium aged domain - DR ${domain.dr}, DA ${domain.da}, ${domain.age} years old with ${domain.backlinks} backlinks.`,
    "url": `${siteUrl}/domain/${slug}`,
    "category": "Aged Domain",
    "brand": {
      "@type": "Brand",
      "name": "Agedify"
    },
    "offers": {
      "@type": "Offer",
      "price": domain.discount_percentage > 0
        ? (domain.price * (1 - domain.discount_percentage / 100)).toFixed(2)
        : domain.price,
      "priceCurrency": "USD",
      "availability": domain.status === 'available'
        ? "https://schema.org/InStock"
        : "https://schema.org/SoldOut",
      "seller": {
        "@type": "Organization",
        "name": "Agedify"
      }
    },
    "additionalProperty": [
      { "@type": "PropertyValue", "name": "Domain Rating", "value": domain.dr },
      { "@type": "PropertyValue", "name": "Domain Authority", "value": domain.da },
      { "@type": "PropertyValue", "name": "Domain Age", "value": `${domain.age} years` },
      { "@type": "PropertyValue", "name": "Backlinks", "value": domain.backlinks },
    ]
  } : null;

  return (
    <>
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      <DomainDetailPage />
    </>
  );
}
