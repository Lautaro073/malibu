import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getSiteUrl, shouldIndexSite } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = getSiteUrl();
const shouldIndex = shouldIndexSite();

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Malibú",
  description:
    "Showroom especializado en ropa deportiva, botines de futbol y accesorios deportivos. Encontra las mejores marcas y los ultimos lanzamientos para potenciar tu rendimiento.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/assets/malibu.jpg",
    shortcut: "/assets/malibu.jpg",
    apple: "/assets/malibu.jpg",
  },
  openGraph: {
    title: "Malibú",
    description:
      "Showroom especializado en ropa deportiva, botines de futbol y accesorios deportivos.",
    url: "/",
    siteName: "Malibú",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "/assets/malibu.jpg",
        alt: "Malibú",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Malibú",
    description:
      "Showroom especializado en ropa deportiva, botines de futbol y accesorios deportivos.",
    images: ["/assets/malibu.jpg"],
  },
  robots: {
    index: shouldIndex,
    follow: shouldIndex,
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
