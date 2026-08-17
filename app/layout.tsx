import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hinga Finance",
  description: "A calm personal finance room for debts, bills, income, and breathing room.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-PH">
      <body>{children}</body>
    </html>
  );
}
