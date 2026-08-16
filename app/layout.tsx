import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PixelCraft - Client-Side Photo Editor',
  description: 'A powerful, fully client-side photo editor built with Next.js, Tailwind CSS, and HTML5 Canvas.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-50 antialiased min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
