import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Service Station Compliance Mini",
  description:
    "Offline-first wetstock reconciliation, adaptive gauging, and environmental early-warning support tool for fuel forecourts.",
  applicationName: "service-station-compliance-mini",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070d1e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-tenant="neutral">
      <body>
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
