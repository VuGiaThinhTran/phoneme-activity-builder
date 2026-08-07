import "./globals.css";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import AssessmentHeader from "@/components/AssessmentHeader";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Phoneme Activity Builder",
  description: "A frontend builder for phoneme-based Wordle and Word Search classroom activities.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value === "dark" ? "dark" : "light";
  const reduceMotion = cookieStore.get("reduceMotion")?.value === "true";
  const compact = cookieStore.get("layout")?.value === "compact";

  return (
    <html
      lang="en"
      className={`h-full ${theme === "dark" ? "dark" : ""} ${reduceMotion ? "reduce-motion" : ""} ${
        compact ? "layout-compact" : ""
      }`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <AssessmentHeader />
        <Navbar />
        <div className="flex-1 w-full">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
