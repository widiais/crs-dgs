import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { LoadingWrapper } from '@/components/LoadingWrapper';
import { SidebarLayout } from '@/components/SidebarLayout';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Digital Signage System',
  description: 'Sistem manajemen konten digital untuk Android TV',
  viewport: 'width=device-width, initial-scale=1, user-scalable=no',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <LoadingWrapper>
            <SidebarLayout>
              {children}
            </SidebarLayout>
          </LoadingWrapper>
        </AuthProvider>
      </body>
    </html>
  );
} 