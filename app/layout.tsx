import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Paperless Studio",
  title: {
    default: "Paperless Studio",
    template: "%s · Paperless Studio",
  },
  description: "A calm, focused workspace for Paperless-ngx.",
  formatDetection: {
    telephone: false,
  },
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
