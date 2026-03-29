import type { Metadata } from 'next';
import { DM_Sans, DM_Mono, Syne } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
});

const dmMono = DM_Mono({
  variable: '--font-dm-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

const syne = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'NirmAI — Infrastructure Accountability · Kerala',
  description:
    'NirmAI maps government construction projects to the contractors who built them. Track defect liability periods and report quality failures publicly.',
  keywords: ['Kerala', 'infrastructure', 'contractor accountability', 'civic tech', 'India', 'panchayat'],
  openGraph: {
    title: 'NirmAI — Infrastructure Accountability · Kerala',
    description: 'Who built this broken drain? Are they still under warranty? NirmAI knows.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className={`${dmSans.variable} ${dmMono.variable} ${syne.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
