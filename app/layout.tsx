import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { startCron } from "@/services/cron";

// Inter is clean and readable — standard choice for dashboards
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

startCron();

export const metadata: Metadata = {
  title: "Calendar Call Alerts",
  description:
    "Get phone call reminders for your Google Calendar events, powered by Twilio.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}