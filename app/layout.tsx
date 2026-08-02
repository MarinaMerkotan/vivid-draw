import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Vividraw — Draw Bold Things on Canvas',
    template: '%s — Vividraw',
  },
  description:
    'A vivid browser drawing studio with layers, expressive brushes, custom palettes, animated replay and PNG or WebP export.',
  authors: [{ name: 'Vividraw' }],
  icons: { icon: '/logo.webp' },
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
