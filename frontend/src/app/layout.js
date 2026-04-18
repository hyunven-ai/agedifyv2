import '@/index.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Agedify - Premium Aged Domains Marketplace',
  description: 'Find and buy premium aged domains with high Domain Rating, Domain Authority, and established backlink profiles for your SEO strategy.',
  keywords: 'aged domains, expired domains, premium domains, domain marketplace, SEO domains, high DR domains',
  openGraph: {
    title: 'Agedify - Premium Aged Domains Marketplace',
    description: 'Find and buy premium aged domains with high DR, DA, and established backlink profiles.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
