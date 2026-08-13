import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.VERCEL_PROJECT_PRODUCTION_URL ??
  process.env.VERCEL_URL ??
  'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`),
  title: {
    default: 'Vividraw — Draw Bold Things on Canvas',
    template: '%s — Vividraw',
  },
  description:
    'A vivid browser drawing studio with layers, expressive brushes, custom palettes, animated replay and PNG or WebP export.',
  authors: [{ name: 'Vividraw' }],
  icons: { icon: '/logo-mark.webp' },
  openGraph: {
    title: 'Vividraw — Draw Bold Things on Canvas',
    description:
      'A vivid browser drawing studio with layers, expressive brushes, custom palettes, animated replay and PNG or WebP export.',
    type: 'website',
    siteName: 'Vividraw',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vividraw — Draw Bold Things on Canvas',
    description:
      'A vivid browser drawing studio with layers, expressive brushes, custom palettes, animated replay and PNG or WebP export.',
    images: [{ url: '/opengraph-image', alt: 'Vividraw — Make something loud today' }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en' className='dark'>
      <body>
        {children}
        <Toaster position='bottom-center' />
      </body>
    </html>
  );
}
