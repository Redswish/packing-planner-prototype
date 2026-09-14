import type { Metadata } from "next";
import { Fira_Code, Montserrat, Playfair_Display } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Packing planner",
  description:
    "A conversational packing assistant that interviews you, then builds a tailored checklist.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${firaCode.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="flex h-full min-h-full flex-col">{children}</body>
    </html>
  );
}
