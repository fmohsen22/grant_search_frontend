import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grant Search Tool",
  description: "Search and find grants based on states and focus areas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
