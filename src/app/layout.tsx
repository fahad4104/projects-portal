import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";

export const metadata: Metadata = {
  title: "Projects Portal",
  description: "Project tracking for Boundary",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
