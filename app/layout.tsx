import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Artea Signal",
  description: "Public product signal board for Artea AI"
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
