import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Iconic Project Tracker | Acres Foundation',
  description: 'Enterprise construction project intelligence platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
