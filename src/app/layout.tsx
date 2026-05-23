import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navbar';

export const metadata: Metadata = {
  title: '虚拟女友',
  description: 'AI 陪伴聊天应用',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-zinc-950">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
