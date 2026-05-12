import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Artea Signal",
  description: "Public product signal board for Artea AI",
  icons: {
    icon: "/artea-logo.png",
    shortcut: "/artea-logo.png",
    apple: "/artea-logo.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
