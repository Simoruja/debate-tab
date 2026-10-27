# FREN: find your friends

FREN is a private personal relationship manager (PRM). After you meet someone, record a quick voice note. FREN turns it into a contact card and maps the person into one graph of your contacts, events and social accounts, so you can see who you know, how you know them, and who you both know.

This folder is a standalone Next.js app (separate from the debate-tab app at the repo root).

## Run it

```bash
cd fren
npm install
npm run dev        # http://localhost:3000
```

The app opens with a demo network so every screen has something in it. Go to **Privacy & data → Clear everything** to start fresh.

### Optional: smarter voice-note parsing with Claude

Voice notes are parsed on-device by default, so nothing needs configuring. To have Claude extract the details instead (better with messy speech-to-text, multiple people, and implied follow-ups), set a key:

```bash
cp .env.example .env.local   # then fill in ANTHROPIC_API_KEY
```

When it's set, `/api/extract` sends the transcript and your contacts' names to Claude. If it's unset, or the call fails, the app falls back to the on-device parser.

## What's in the MVP

| Screen | What it does |
| --- | --- |
| **Landing** (`/`) | The pitch, how it works, and a comparison with work CRMs and manual PRMs |
| **Home** (`/app`) | Keep-in-touch reminders, birthdays, people met recently, and a prompt for anyone who still has almost no details |
| **Voice note** (`/app/capture`) | Live dictation (Web Speech API) → extraction → editable review cards. Handles several people in one note, recognises people who are already in FREN and adds the note to their timeline, and links mutuals, the event and who introduced you |
| **People** (`/app/people`) | Search across names, companies, "how we met", interests, notes and handles. Filter by circle, tag or source; grid or list view |
| **Profile** (`/app/people/:id`) | How you know them, where to find them (Instagram, LinkedIn, X, phone…), keep-in-touch cadence, mutuals, introductions, talking points, and a timeline of notes and calls (with dictation) |
| **Graph** (`/app/graph`) | Force-directed map of you, your people, events and social platforms. Pan, zoom, drag, filter by circle. **Mutuals finder** shows the people two contacts share and the shortest intro chain between them |
| **Events** (`/app/events`) | Everyone you met at each event, plus a "how many stuck?" score: the share you've been in touch with since |
| **Recall** (`/app/recall`) | A flashcard round built from memory clues, so new names stick. People you met recently or keep forgetting come up first |
| **Import & merge** (`/app/import`) | Phone contacts (.vcf), LinkedIn `Connections.csv`, Google/Outlook CSV and Instagram JSON exports. Matches people by name, email, phone or LinkedIn, and suggests duplicates to merge. Sample files are in `public/samples/` |
| **Privacy & data** (`/app/settings`) | Where the data lives, JSON backup and restore, reset |

## How it's built

- Next.js 16 (App Router), React 19, Tailwind CSS 4, lucide icons
- **Storage:** everything sits in one JSON document in `localStorage` (`src/lib/store.ts`). There are no accounts and no database. That's the "private layer", and it keeps the MVP free to host
- **Voice:** browser speech recognition (`src/lib/use-speech.ts`), then either the rule-based parser (`src/lib/extract.ts`) or Claude with structured outputs (`src/app/api/extract/route.ts`)
- **Graph:** a small force-directed layout written for this app (`src/lib/graph.ts`) and rendered as SVG

## Deploying

On Vercel, import the repo and set **Root Directory** to `fren`. Add `ANTHROPIC_API_KEY` as an environment variable if you want AI parsing.

## Next steps after the MVP

- Accounts and encrypted sync across devices
- Live connectors (Gmail, LinkedIn, Instagram) instead of file exports, to keep "last talked" dates current automatically
- Keep the audio clip with each voice note
- Native mobile app with a lock-screen / Action Button shortcut for capture
