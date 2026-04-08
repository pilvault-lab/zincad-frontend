import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Zincad — Free Video Downloader | YouTube, TikTok, Instagram & More",
  description:
    "Download videos from YouTube, TikTok, Instagram, Twitter and 50+ sites for free. No signup, no software install. Paste your link and download instantly in HD, 4K, or MP3.",
  keywords: [
    "video downloader",
    "YouTube downloader",
    "TikTok downloader",
    "Instagram video download",
    "Twitter video downloader",
    "Facebook video downloader",
    "Reddit video downloader",
    "Vimeo downloader",
    "free video downloader",
    "online video downloader",
    "download video",
    "HD video download",
    "4K video download",
    "MP3 downloader",
    "convert video to MP3",
  ],
  metadataBase: new URL("https://zincad.com"),
  alternates: {
    canonical: "https://zincad.com",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Zincad — Free Video Downloader | YouTube, TikTok, Instagram & More",
    description:
      "Download videos from YouTube, TikTok, Instagram, Twitter and 50+ sites. No signup, no software. Paste your link and go.",
    url: "https://zincad.com",
    siteName: "Zincad",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Zincad — Free Online Video Downloader",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zincad — Free Video Downloader",
    description:
      "Download videos from YouTube, TikTok, Instagram, Twitter and 50+ sites. Paste your link and go.",
    images: ["/og-image.png"],
    creator: "@zincad",
  },
  other: {
    "apple-mobile-web-app-title": "Zincad",
    "application-name": "Zincad",
  },
};

function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Zincad",
    url: "https://zincad.com",
    description:
      "Free online video downloader. Download videos from YouTube, TikTok, Instagram, Twitter, Facebook, Reddit, Vimeo and 50+ more sites. No signup required.",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    browserRequirements: "Requires JavaScript",
    featureList: [
      "YouTube video download",
      "TikTok video download",
      "Instagram video download",
      "Twitter/X video download",
      "Facebook video download",
      "Reddit video download",
      "Vimeo video download",
      "MP3 audio extraction",
      "4K and HD quality support",
      "No registration required",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <JsonLd />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#2563eb" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: {
              borderRadius: "12px",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
