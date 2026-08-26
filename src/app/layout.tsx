import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/nav";

export const metadata: Metadata = {
  title: "GAAP Tracker — SEC Filing Implementation Analytics",
  description:
    "Track how U.S. public companies implement complex accounting standards using SEC EDGAR public data.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
        <footer className="border-t border-rule mt-20 py-8 text-center text-sm text-ink-faint">
          Data from SEC EDGAR public APIs. Updated every 6 hours. Not
          affiliated with the SEC, FASB, or any government entity.
        </footer>
      </body>
    </html>
  );
}
