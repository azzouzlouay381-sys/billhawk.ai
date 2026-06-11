import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "BillHawk AI — Stop Overpaying. Start Negotiating.",
  description:
    "Upload any bill and BillHawk AI extracts the pricing details, redacts your personal info, and hands you a word-for-word negotiation script to cut your costs.",
  openGraph: {
    title: "BillHawk AI",
    description: "Privacy-first bill negotiation assistant powered by AI.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Sonner toast — dark theme matching the brand */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1A3558",
              border: "1px solid #2E4D6B",
              color: "#E8F0F8",
            },
          }}
        />
      </body>
    </html>
  )
}
