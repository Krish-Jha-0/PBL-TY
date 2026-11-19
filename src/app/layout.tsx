import type { Metadata } from 'next';
import './globals.css';
import { RailwayProvider } from '@/context/RailwayContext';
import { RailwayShell } from '@/components/layout/RailwayShell';

export const metadata: Metadata = {
  title: 'Intelligent Train Traffic & Platform Management | Daund–Pune Corridor',
  description:
    'Decision-support system for real-time train prioritization and conflict-free platform allocation on the Daund Junction to Pune Junction railway corridor.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full bg-[#070d19] text-slate-100 flex flex-col font-sans antialiased selection:bg-sky-500 selection:text-white">
        <RailwayProvider>
          <RailwayShell>{children}</RailwayShell>
        </RailwayProvider>
      </body>
    </html>
  );
}
