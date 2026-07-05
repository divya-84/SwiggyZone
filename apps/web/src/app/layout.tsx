import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from '../providers';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'SwiggyZone | Premium AI-Powered Food Delivery',
  description:
    'Order food with smart AI search, personalized dietary customization, and live maps.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="antialiased bg-dark-bg text-dark-text min-h-screen relative">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
