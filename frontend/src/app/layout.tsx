import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans, Fira_Code } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const firaCode = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "EchoGuard — AI Deepfake Audio Detection",
  description:
    "Detect deepfake audio in seconds with military-grade AI analysis. Upload, analyze, and verify voice authenticity with EchoGuard's advanced detection engine.",
  keywords: ["deepfake detection", "audio analysis", "AI security", "voice verification"],
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${dmSans.variable} ${firaCode.variable} antialiased`}
      >
        <Toaster position="bottom-right" theme="dark" richColors />
        {children}
      </body>
    </html>
  );
}
