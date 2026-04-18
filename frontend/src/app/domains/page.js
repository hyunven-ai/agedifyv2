import DomainsPage from '@/views/DomainsPage';

export const revalidate = 180;

export const metadata = {
  title: 'Browse Premium Domains | Agedify',
  description: 'Explore our curated marketplace of premium aged domains. Filter by DR, DA, price, age, and more to find the perfect domain for your project.',
};

export default function Domains() {
  return <DomainsPage />;
}
