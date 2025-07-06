import type { Metadata, Viewport } from 'next';
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
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  userScalable: false,
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
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