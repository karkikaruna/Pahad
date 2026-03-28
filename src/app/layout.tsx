import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/hooks/useAuth";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Pahad - मानसिक स्वास्थ्य अनुगमन",
  description: "FCHV Mental Health Monitoring System for Nepal",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pahad",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10b981",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ne">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
