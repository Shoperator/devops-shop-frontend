import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PublicEnvScript } from "next-runtime-env";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { getShopName, getShopTagline } from "@/config/shop";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// A static `metadata` export is evaluated during the build, which would pin the
// tab title to the fallback name for every shop. Reading it per request keeps
// the title in step with the env the operator set on this deployment.
export function generateMetadata(): Metadata {
  return {
    title: getShopName(),
    description: getShopTagline(),
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Publishes the NEXT_PUBLIC_ vars of the running container to the
            browser, so client components read this shop's values instead of
            whatever was set when the image was built. */}
        <PublicEnvScript />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <NavBar />
          <main className="flex-1">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
