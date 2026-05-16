import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prelegal — Common Paper drafting assistant",
  description:
    "Draft any Common Paper legal agreement by chatting with an AI assistant. Drafts only — not a substitute for legal review.",
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
