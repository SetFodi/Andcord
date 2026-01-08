import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/hooks/useAuth";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import InitialLoader from "@/components/providers/InitialLoader";

const inter = Inter({
  variable: "--font-primary",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Andcord - Connect with Friends",
  description: "A modern social media app for connecting with friends",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Andcord",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable} suppressHydrationWarning>
        <ThemeProvider>
          <InitialLoader>
            <AuthProvider>
              {children}
            </AuthProvider>
          </InitialLoader>
        </ThemeProvider>
      </body>
    </html>
  );
}
