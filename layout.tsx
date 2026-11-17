import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "SmartPark | Smart Parking Reservation",
  description: "Find and reserve parking spaces with SmartPark.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <footer>© {new Date().getFullYear()} SmartPark · Park smarter. Save time.</footer>
      </body>
    </html>
  );
}
