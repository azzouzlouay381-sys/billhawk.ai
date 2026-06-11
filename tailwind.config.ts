import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // BillHawk brand palette — deep navy trust + sharp amber action
        hawk: {
          navy:    "#0B1F3A",   // primary dark
          steel:   "#1A3558",   // card bg / section bg
          slate:   "#2E4D6B",   // borders, subtle dividers
          sky:     "#4A90C4",   // accent links
          amber:   "#F5A623",   // primary CTA — confident action
          "amber-dim": "#C9851A",
          mint:    "#34C77B",   // savings / positive
          "mint-dim": "#27A363",
          rose:    "#E8525A",   // cost highlight / warning
          "rose-dim": "#C43E45",
          mist:    "#E8F0F8",   // light text on dark
          fog:     "#B0C4D8",   // secondary text
        },
      },
      fontFamily: {
        // Inter for UI + Instrument Serif for display numbers
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-instrument)", "Georgia", "serif"],
      },
      borderRadius: {
        "xl": "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        "card": "0 1px 3px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.2)",
        "glow-amber": "0 0 24px rgba(245,166,35,0.25)",
        "glow-mint": "0 0 20px rgba(52,199,123,0.2)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}

export default config
