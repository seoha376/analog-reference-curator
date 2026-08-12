import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Analog Reference Curator",
  description: "A mobile-friendly board for analog, cute, dense web UI references.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg"
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
