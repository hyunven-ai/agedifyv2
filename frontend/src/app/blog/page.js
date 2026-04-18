import BlogPage from '@/views/BlogPage';

export const revalidate = 300;

export const metadata = {
  title: 'Blog | Agedify',
  description: 'Read our latest articles about domain investing, SEO strategies, and digital marketing tips.',
};

export default function Blog() {
  return <BlogPage />;
}
