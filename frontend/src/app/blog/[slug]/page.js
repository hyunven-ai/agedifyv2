import BlogPostPage from '@/views/BlogPostPage';
import { getServerApiUrl } from '@/lib/server-api';

export const revalidate = 300;

async function getPost(slug) {
  try {
    const apiUrl = getServerApiUrl();
    const res = await fetch(`${apiUrl}/api/blog/posts/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Blog Post | Agedify' };
  return {
    title: `${post.meta_title || post.title} | Agedify Blog`,
    description: post.meta_description || post.excerpt || '',
    openGraph: {
      title: post.title,
      description: post.excerpt || '',
      type: 'article',
      ...(post.featured_image && { images: [post.featured_image] }),
    },
  };
}

export async function generateStaticParams() {
  try {
    const apiUrl = getServerApiUrl();
    const res = await fetch(`${apiUrl}/api/blog/posts`);
    if (!res.ok) return [];
    const posts = await res.json();
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

  const articleSchema = post ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.meta_description || post.excerpt || '',
    "author": {
      "@type": "Person",
      "name": post.author || 'Agedify Team'
    },
    "publisher": {
      "@type": "Organization",
      "name": "Agedify",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo-agedify.png`
      }
    },
    "datePublished": post.published_at,
    "dateModified": post.updated_at || post.published_at,
    "mainEntityOfPage": `${siteUrl}/blog/${slug}`,
    ...(post.featured_image && { "image": post.featured_image }),
    ...(post.focus_keyword && { "keywords": post.focus_keyword }),
    "articleSection": post.category?.name || "Blog"
  } : null;

  return (
    <>
      {articleSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
      )}
      <BlogPostPage />
    </>
  );
}
