# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `vintia-app/`:

```bash
npm run dev       # Start dev server (Vite)
npm run build     # Type-check + production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

No test suite exists in this project.

## Architecture

Single-page React 19 + TypeScript app built with Vite. Backend is Supabase (auth + database). No routing library — navigation is state-driven (`currentView` in `VosVentesScreen`).

### Data flow

```
App.tsx
  └─ TutorialProvider (TutorialContext)
       └─ AppContent
            └─ VosVentesScreen  ← all app state lives here
                 ├─ TopBar
                 ├─ SideNav      ← platform filter
                 ├─ MainContent  ← StatsBar + AIHeader + ItemTable
                 └─ SettingsPanel (when currentView === 'settings')
```

`VosVentesScreen` owns all state and passes handlers down as props. There is no global store.

### Key patterns

- **Supabase hooks** in `src/hooks/useSupabaseData.ts`: `useItems`, `usePlatforms`, `useAISettings`, `useUserProfile` — each manages its own CRUD against Supabase.
- **AI analysis** in `src/services/webSearch.ts` — `analyzeItem()` calls the configured AI provider (Gemini, Claude, OpenAI, Perplexity, Mistral, Grok) with a structured prompt, returns `WebSearchResult`.
- **Daily AI recommendation** in `src/services/dailyRecommendation.ts` — cached per user in localStorage until the next day at 10:00.
- **Tutorial system**: `TutorialContext` injects mock items (prefixed `tutorial_mock_`) into the live item list via `registerAppApi`, activating `react-joyride` steps in `TutorialOverlay`.
- **Inline editing**: `ItemTable` renders rows via `InlineRow`, which handles all field editing inline with `onSaveItem` callbacks.

### Styling

Pure inline React styles throughout — no CSS modules, no Tailwind. The `theme` object (`src/theme/`) and `hexAlpha()` utility are the only styling primitives. Global CSS is minimal (`src/index.css`).

### AI provider config

`AISettings` (stored in Supabase) holds `provider`, `apiKey`, `model`, and up to 2 `fallbackKeys`. The fallback chain is tried automatically when the primary provider fails to access a URL.
