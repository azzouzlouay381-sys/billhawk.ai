# BillHawk AI 🦅

**Privacy-first bill negotiation assistant powered by GPT-4o Vision.**

Upload any bill image → AI redacts your personal info → You get a word-for-word negotiation script.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Add your OpenAI API key
#    Open: app/api/analyze-bill/route.ts
#    Find: apiKey: "sk-REPLACE_WITH_YOUR_OPENAI_API_KEY"
#    Replace with your key from: https://platform.openai.com/api-keys

# 3. Run locally
npm run dev
# → Open http://localhost:3000
```

---

## Project Structure

```
billhawk/
├── app/
│   ├── layout.tsx                   # Root layout, fonts, Toaster
│   ├── page.tsx                     # Landing page + hero
│   ├── globals.css                  # Tailwind base + brand tokens
│   └── api/
│       └── analyze-bill/
│           └── route.ts             # ← OpenAI Vision API call lives here
│                                    #   API key is hardcoded on line ~9
├── components/
│   ├── BillDropzone.tsx             # Drag/drop + paste + file upload UI
│   └── AnalysisResult.tsx           # Results cards + copy script button
├── lib/
│   └── types.ts                     # Shared TypeScript interfaces
├── netlify.toml                     # Netlify deployment config
├── tailwind.config.ts               # Brand color palette + typography
└── .env.example                     # Reference for env var approach
```

---

## Where to Put Your API Key

Open `app/api/analyze-bill/route.ts` and find this line near the top:

```typescript
const openai = new OpenAI({
  apiKey: "sk-REPLACE_WITH_YOUR_OPENAI_API_KEY",
})
```

Replace the placeholder with your real key. That's it.

> ⚠️ If this is a public GitHub repo, consider switching to an environment variable instead (see `.env.example` for instructions) to avoid accidentally leaking your key.

---

## Deploy to Netlify

### One-click via GitHub

1. Push this repo to GitHub
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import from Git**
3. Select your repo
4. Build settings are auto-detected from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
5. Click **Deploy site**

### Required Netlify Plugin

The `netlify.toml` already includes `@netlify/plugin-nextjs`. Netlify will install it automatically. If it doesn't, run:

```bash
npm install -D @netlify/plugin-nextjs
```

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 App Router | Frontend + API routes in one repo |
| Styling | Tailwind CSS | Utility-first, no CSS files to manage |
| File upload | react-dropzone | Handles drag/drop + click; we add paste manually |
| AI | OpenAI GPT-4o Vision | Best-in-class OCR + reasoning combo |
| Toasts | Sonner | Lightweight, beautiful notifications |
| Deploy | Netlify + @netlify/plugin-nextjs | Zero-config Next.js hosting |

---

## Privacy Model

- Files are converted to base64 **in the browser** — they never touch a database
- The OpenAI API call is made **server-side** (API route) — your key is never exposed to the browser
- The system prompt explicitly instructs GPT-4o to **ignore and never output** any PII
- No file contents are logged or persisted anywhere in this codebase

---

## Supported File Types

| Type | Notes |
|---|---|
| `.jpg` / `.jpeg` | ✅ Full support |
| `.png` | ✅ Full support |
| `.heic` | ✅ Accepted (iOS screenshots) |
| `.pdf` | ⚠️ Best results: screenshot the PDF first |
| Clipboard paste | ✅ Ctrl+V / Cmd+V anywhere on the page |

---

## Customization

**Change the AI model** (e.g., to save costs):
```typescript
// app/api/analyze-bill/route.ts
model: "gpt-4o-mini",  // ~10x cheaper, slightly less accurate
```

**Add more extracted fields:**
1. Add to the `SYSTEM_PROMPT` in `route.ts`
2. Add to the `BillAnalysis` interface in `lib/types.ts`
3. Display in `components/AnalysisResult.tsx`
