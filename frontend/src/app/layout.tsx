import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mutual NDA Creator",
  description:
    "Generate a Common Paper Mutual Non-Disclosure Agreement from a simple form.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
