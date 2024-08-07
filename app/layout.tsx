import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "openai-assistant-gotoHuman-demo",
  description: "Use this NextJS app to build an OpenAI assistant with gotoHuman for human fallback",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className + ""}>{children}</body>
    </html>
  );
}
