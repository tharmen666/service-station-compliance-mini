import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Service Station Compliance Mini",
  description:
    "Wetstock, calibrated dipstick, shift and drill compliance for East African forecourts. Offline-capable, append-only audit ledger.",
  applicationName: "service-station-compliance-mini",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e293b",
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
