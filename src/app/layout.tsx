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
    "Download videos from YouTube, TikTok, Instagram, Twitter and 50+ sites. No signup, no software. Paste your link and go.",
  metadataBase: new URL("https://zincad.com"),
  alternates: {
    canonical: "https://zincad.com",
  },
  openGraph: {
    title: "Zincad — Free Video Downloader",
    description:
      "Download videos from YouTube, TikTok, Instagram, Twitter and 50+ sites. No signup, no software.",
    url: "https://zincad.com",
    siteName: "Zincad",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Zincad — Free Video Downloader",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zincad — Free Video Downloader",
    description:
      "Download videos from YouTube, TikTok, Instagram, Twitter and 50+ sites.",
    images: ["/og-image.png"],
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
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
