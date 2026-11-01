# Tiny Trace — Final Project Status

**Project:** Tiny Trace — AI-Powered Gesture-Based Learning System for Kids
**Status:** Final submission build (Phase 7 complete)
**Last updated:** 2 November 2026

---

## 1. Project overview

Tiny Trace is a browser-based learning application for children aged 4–7. A child traces
strokes, shapes, numbers, letters and words **in the air**; a webcam plus MediaPipe hand
landmark detection turns the index fingertip into a pen, and a translucent ghost guide
shows the path to follow. Each attempt is scored with deterministic geometry
(shape deviation, direction, start/end position, smoothness, completion, stroke order),
which drives stars, XP, badges, animal friends and lesson unlocking. Progress is stored
locally on the device.

The application is a jungle-themed single-page app with a separate parent dashboard.
There is **no backend, no database and no custom-trained AI model**; the only machine
learning component is Google MediaPipe's pre-trained Hand Landmarker running on-device.

**Application type:** web application (client-side vision, SSR shell via TanStack Start).

---

## 2. Completed phases

| Phase | Scope | Status |
| --- | --- | --- |
| Phase 1 | Project foundation, data model (`src/lib/types.ts`) and normalized coordinate space | Complete (existing codebase) |
| Phase 2 | Design system, jungle theme, mascot, layout and shared UI components | Complete (existing codebase) |
| Phase 3 | Curriculum: 5 worlds and 53 lesson templates (`src/data/`) | Complete (existing codebase) |
| Phase 4 | Real-time air-writing canvas, ghost guide and stroke rendering | Complete (existing codebase) |
| Phase 5 | Webcam + MediaPipe hand tracking with pinch pen, plus scripted demo provider | Complete (existing codebase) |
| Phase 6 | Scoring, stars, XP, badges, unlocks, persistence, result/rewards/profile/settings and parent dashboard | Complete (existing codebase) |
| Phase 7 | Final cleanup, Tiny Trace branding/metadata, README, regression audit, removal of unused shadcn UI primitives and dependencies, TypeScript + production build, this document | Complete (this phase) |

No Phase 8 work was started. No new application features, redesigns, Python backend or
changes to the MediaPipe pipeline were made in Phase 7.

---

## 3. Final technologies

**Runtime:** React 19, TypeScript 5.8 (strict), TanStack Start 1.x, TanStack Router 1.x,
TanStack Query 5, Vite 8, Nitro (Cloudflare-module preset), Tailwind CSS 4,
class-variance-authority, lucide-react, Recharts. UI controls are custom Tiny Trace
components in `src/components/ui-tt` (the unused shadcn/Radix primitives were removed).

**Computer vision:** `@mediapipe/tasks-vision` (`FilesetResolver` + `HandLandmarker` in
VIDEO mode), with the WASM runtime vendored in `public/mediapipe/wasm/` and the
pre-trained model at `public/models/hand_landmarker.task`.

**Persistence:** browser `localStorage` (`tiny-trace:progress:v1`).

**Build tooling:** `@lovable.dev/vite-tanstack-config` (required Vite/TanStack Start build
wrapper referenced by `vite.config.ts`), ESLint, Prettier.

---

## 4. Main algorithms

1. **Hand tracking** — MediaPipe Hand Landmarker, 21 landmarks, one hand, single mirror
   (`x → 1 − x`) so screen motion matches the child's hand; frames are de-duplicated and
   inference is throttled to ~32 ms.
2. **Pinch pen** — thumb-tip ↔ index-tip distance normalized by palm size (wrist → middle
   MCP) with hysteresis (start 0.32, release 0.5) and two-frame debounce.
3. **Projection** — `projectToSurface()` undoes the video's `object-fit: cover` crop and the
   canvas inset (`DRAWING_SURFACE_PADDING = 26`) using live element geometry, keeping
   pointer, ink and guide in one space.
4. **Smoothing** — exponential smoothing (α = 0.45) plus a 0.004 normalized duplicate
   threshold for live input; Chaikin-style `smooth()` for rendering.
5. **Resampling** — arc-length resampling to 48 points for scoring, 60 for the animated
   stroke demonstration.
6. **Shape comparison** — point-to-segment distance; drawn → guide uses a trimmed mean
   (worst 12 % ignored), guide → drawn uses the plain mean; Gaussian falloff
   `exp(−(error / tolerance)²)` with tolerance = 25 % of stroke size (floor 0.3).
7. **Direction** — mean tangent agreement sampled at the nearest guide segment.
8. **Completion / overshoot gating** — `0.5 + 0.5 × min(1, lengthRatio)` and a length-fit
   factor beyond 1.5× guide length.
9. **Stroke matching** — globally greedy best-pair matching of guide strokes to drawn
   strokes, plus order penalty (≤ 12 %) and extra-stroke penalty (−6 each, capped −15).
10. **Gamification** — `starsFor()` thresholds (40/60/74/86/95), XP
    `round(reward × (0.6 + 0.1 × stars))`, level per 150 XP, badge and animal rules,
    ordered lesson/world unlocking.

---

## 5. Final folder structure

```
tiny-trace/
├── .gitignore                     (renamed from `gitignore` so it takes effect)
├── README.md
├── PROJECT_FINAL_STATUS.md
├── package.json / package-lock.json / bun.lock
├── tsconfig.json / vite.config.ts / eslint.config.js / bunfig.toml
├── public/
│   ├── favicon.svg / favicon.png / favicon.ico   Tiny Trace app icon
│   ├── mediapipe/wasm/                           Vendored MediaPipe WASM runtime
│   ├── models/hand_landmarker.task               Pre-trained hand-landmark model
│   └── robots.txt
└── src/
    ├── components/   air-writing, animals, branding, camera, dashboard, graphics,
    │                 journey, lessons, navigation, progress, rewards, ui-tt
    ├── data/         curriculum.ts (5 worlds, 53 lessons), strokes.ts (glyph templates)
    ├── lib/          geometry.ts, drawing-surface.ts, types.ts, utils.ts,
    │                 error-capture.ts, error-page.ts
    ├── routes/       index, onboarding, home, journey, world.$worldId,
    │                 lesson.$lessonId, result, rewards, profile, settings, parent
    ├── services/     progressService, lessonService, analyticsService, voiceService
    ├── state/        app-state.tsx
    ├── vision/       types, camera-vision-provider, mediapipe-vision-provider,
    │                 mock-vision-provider, provider-factory, index
    ├── router.tsx / server.ts / start.ts / styles.css
    └── routeTree.gen.ts (generated — do not edit by hand)
```

---

## 6. Build and test results

| Check | Command | Result |
| --- | --- | --- |
| TypeScript | `npx tsc --noEmit` | **Pass** — no type errors (re-run after the dead-code cleanup) |
| Production build | `npm run build` | **Pass** — client, SSR and Nitro (cloudflare-module) builds generated in `.output/`; re-run after the dead-code cleanup |
| Dead-code cleanup | 46 unused UI primitives + 1 hook + `components.json` removed; 37 runtime packages uninstalled | **Pass** — no app code imported the removed files; emitted bundle sizes were unchanged |
| Dev server | `npm run dev` | **Pass** — Vite ready, all routes served |
| Route smoke test | `curl` on `/`, `/home`, `/journey`, `/world/stroke-forest`, `/lesson/stroke-horizontal`, `/result`, `/rewards`, `/profile`, `/settings`, `/parent`, `/onboarding` | **Pass** — HTTP 200 with correct page title and Tiny Trace metadata |
| All lessons | `curl` on all 53 lesson URLs (`stroke-*`, `shape-*`, `number-0…9`, `letter-A…Z`, `word-CAT/SUN/LION/TREE/NEST`) | **Pass** — 53/53 returned HTTP 200 |
| Static assets | `curl` on `/favicon.svg`, `/models/hand_landmarker.task` | **Pass** — 200; model served from `public/` |
| Automated test suite | — | **Not available** — the project has no test script (`package.json` defines dev, build, build:dev, preview, lint, format only) |

Build warnings observed are dependency/config notices (`vite-tsconfig-paths` deprecation
hint, rolldown `"use client"` directive notes, code-splitting debug-name hint) and do not
affect the generated build.

---

## 7. Branding and metadata (Phase 7)

- Removed builder-only files: `.lovable/project.json`, `AGENTS.md`,
  `src/lib/lovable-error-reporting.ts` (its only caller was the root error boundary, which
  still logs via `console.error`), and the default builder favicon.
- New Tiny Trace app icon generated from the existing `TraceMark` artwork:
  `public/favicon.svg` (vector), `public/favicon.png` (256×256) and `public/favicon.ico`
  (256×256). All three are copied into the production build output.
- Root metadata now carries Tiny Trace title, description, keywords, `application-name`,
  `apple-mobile-web-app-title`, Open Graph/Twitter tags, a theme colour matching the app's
  cream background, and the favicon links. Per-page titles were already Tiny Trace–branded.
- `package.json` renamed to `tiny-trace` (v1.0.0) with a description; lockfile root metadata
  updated to match.
- The only remaining `@lovable.dev` reference is the build-time wrapper
  `@lovable.dev/vite-tanstack-config`, which `vite.config.ts` requires. It is a third-party
  build dependency, not user-visible branding, and removing it would break the build.
- The jungle theme, mascot, colour palette and layout were left unchanged.
- Dead code removed: all 46 unused shadcn primitives under `src/components/ui/`, the
  `src/hooks/use-mobile.tsx` helper used only by the unused sidebar, and the now-stale
  `components.json` config. The app itself only ever imported `src/components/ui-tt`, so
  behaviour and bundle contents are unchanged.
- 37 runtime dependencies that were used only by those files were uninstalled (26 Radix
  packages, `@hookform/resolvers`, `cmdk`, `date-fns`, `embla-carousel-react`, `input-otp`,
  `react-day-picker`, `react-hook-form`, `react-resizable-panels`, `sonner`, `vaul`, `zod`).
  The runtime dependency list went from 53 to 16 packages.

---

## 8. Known limitations

- Hand tracking depends on lighting, camera quality and background; the model tracks one
  hand and one fingertip (index finger) at a time.
- Pinch detection is heuristic and can mis-trigger for very small or very close hands.
- Scoring evaluates path fidelity against a guide, not pedagogic letter formation.
- Progress lives in `localStorage`: per browser profile, per device, no sync; clearing site
  data erases it. The first run seeds a small demo profile (60 XP, 2 completed lessons).
- The Settings page saves a demo-mode preference, but the lesson screen still opens in
  camera mode; demo mode is chosen per lesson with **Use demo mode**.
- Voice guidance uses the Web Speech API and depends on installed system voices.
- No automated tests or CI; verification is TypeScript, production build and route checks.
- No backend, accounts, teacher view or cloud storage exists.

---

## 9. Remaining manual verification

These behaviours require a real webcam and browser and could not be verified
automatically in this environment. They were manually confirmed by the project owner in
earlier phases and were not modified in Phase 7, but they should be re-checked once on the
submission machine:

- [ ] Camera permission prompt appears only after pressing **Let's trace**.
- [ ] MediaPipe model loads and 21 landmarks track the hand (status shows "I can see you!").
- [ ] Pinch starts a stroke; letting go ends it; a second pinch starts a new stroke.
- [ ] Left/right motion feels natural (no reversed axis) and the fingertip aligns with the
      ink and the ghost guide.
- [ ] Multiple strokes are recorded separately; a lost hand ends the stroke and hides the
      pointer without leaving stale ink.
- [ ] Demo mode replays the path and scores an attempt.
- [ ] Score, stars and XP match the rubric in README §12; stray dots and scribbles are
      penalised as described.
- [ ] Finish, retry and "Start over" behave correctly; an empty attempt cannot be scored.
- [ ] Lesson/world unlocking, badges and animal friends unlock as expected.
- [ ] Progress survives a page refresh; the parent dashboard and result screen show the
      stored figures.
- [ ] Layout remains usable at phone, tablet and desktop widths.

---

## 10. Handoff notes

- **Nothing is incomplete in code.** The only open items are the manual webcam checks in
  §9, which need physical hardware.
- Before a live demonstration, use **Settings → Reset progress** if the seeded demo profile
  should be cleared.
- Serve over `https://` or `http://localhost` — browsers block camera access on other
  origins.
- Do not delete `public/mediapipe/wasm/` or `public/models/hand_landmarker.task`; hand
  tracking stops working without them.
- Keep `vite.config.ts` and the `@lovable.dev/vite-tanstack-config` dev dependency together;
  replacing the wrapper requires rewriting the whole Vite/TanStack Start configuration.

---

## 11. Running the project

```bash
npm install          # install dependencies (Node.js 20.19+ or 22.12+)
npm run dev          # development server (Vite prints the local URL)
npx tsc --noEmit     # type check
npm run build        # production build into .output/
npm run preview      # preview the production build
```

Full usage, scoring and architecture documentation is in `README.md`.
