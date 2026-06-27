import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paperless Studio",
  description: "A calm, focused workspace for Paperless-ngx.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
