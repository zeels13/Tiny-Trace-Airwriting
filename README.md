Check this out: [Tiny Trace Live Demo](https://tinytraceap.vercel.app/)

# Tiny Trace — AI-Powered Gesture-Based Learning System for Kids

Tiny Trace is a browser-based learning application that helps children aged 4–7 practise
handwriting by tracing strokes, shapes, numbers, letters and words in the air.
A webcam and MediaPipe hand-landmark detection turn the child's index finger into a
pen, while a translucent ghost guide shows the trail to follow. Every attempt is scored
with deterministic geometry, and progress is saved on the device.

![Status](https://img.shields.io/badge/status-Third%20Year%20Computer%20Graphics%20and%20Image%20Processing%20Project-2e7d5b)
![Stack](https://img.shields.io/badge/stack-React%2019%20%2B%20TanStack%20Start%20%2B%20TypeScript-0f766e)

---

## Table of contents

1. [Problem statement](#1-problem-statement)
2. [Proposed solution](#2-proposed-solution)
3. [Main features](#3-main-features)
4. [Technologies used](#4-technologies-used)
5. [Architecture and data flow](#5-architecture-and-data-flow)
6. [Computer graphics concepts and algorithms](#6-computer-graphics-concepts-and-algorithms)
7. [Project folder structure](#7-project-folder-structure)
8. [Installation](#8-installation)
9. [Running locally](#9-running-locally)
10. [Webcam permission requirements](#10-webcam-permission-requirements)
11. [How to use the application](#11-how-to-use-the-application)
12. [Scoring system](#12-scoring-system)
13. [Progress storage](#13-progress-storage)
14. [Team contributions](#14-team-contributions)
15. [Limitations and future scope](#15-limitations-and-future-scope)
16. [Credits and third-party dependencies](#16-credits-and-third-party-dependencies)

---

## 1. Problem statement

Young children are still developing the fine motor control needed for pencil-and-paper
writing. Conventional tracing worksheets give no immediate feedback, and a child who
starts a stroke in the wrong place or moves backwards has no way of knowing until an
adult checks the page. Tablet tracing apps require a touchscreen and stylus-like
precision, and many "educational" apps are passive video content rather than practice.

Tiny Trace addresses three gaps:

- **Feedback gap** — children need instant, encouraging feedback on how closely they
  followed a letter or shape.
- **Access gap** — the practice should run on an ordinary laptop with a webcam, without
  extra hardware, installation or an account.
- **Engagement gap** — repeated drill is boring, so practice is framed as a jungle
  journey with animal guides, stars, XP and unlockable worlds.

## 2. Proposed solution

Tiny Trace is a single-page web application with a child-facing "jungle" interface and a
separate parent dashboard.

1. The child opens a lesson and sees a ghost guide of the target character built from
   normalized stroke paths.
2. Pressing **Let's trace** requests camera access. MediaPipe's **Hand Landmarker**
   model detects 21 hand landmarks per frame in the browser.
3. The index fingertip drives an on-screen pointer. Pinching the thumb and index finger
   starts a stroke; releasing it ends the stroke.
4. The drawn polyline is compared geometrically with the reference stroke template.
   Shape deviation, direction, start/end position, smoothness, completion and stroke
   order produce an accuracy score, star rating and XP.
5. Results, stars, XP and lesson unlocks are persisted in `localStorage`, so the journey
   continues after a page refresh.

A scripted **demo mode**, selected explicitly inside a lesson, replays the reference path
when a camera is unavailable or the app is being demonstrated.

The system uses a pre-trained, general-purpose MediaPipe hand-landmark model. **No custom
machine-learning model was trained for this project.** "AI-powered" refers to the use of
that pre-trained on-device vision model for hand tracking; scoring itself is classical
geometry, not a neural network.

## 3. Main features

| Feature | What it does |
| --- | --- |
| Webcam-based hand tracking | `getUserMedia` provides a mirrored live preview; the stream starts only after an explicit **Let's trace** click. |
| MediaPipe hand landmark detection | MediaPipe Tasks Vision `HandLandmarker` runs in `VIDEO` mode on the local WebAssembly fileset and the locally served `hand_landmarker.task` model, one hand at a time. |
| Pinch-based air writing | Thumb-tip ↔ index-tip distance, normalized by palm size, acts as a pen with hysteresis and a two-frame debounce. Letting go commits the stroke. |
| Ghost reference guides | A translucent multi-layer SVG/canvas guide shows the complete character, completed strokes, the active stroke (dashed) and a pulsing start dot. |
| Real-time drawing canvas | A `<canvas>` driven by `requestAnimationFrame` draws finished ink, the live stroke and a fingertip halo without per-frame React state updates. |
| Stroke, shape, number, letter and word tracing | Five worlds covering 5 strokes, 7 shapes, digits 0–9, letters A–Z and 5 words — **53 lessons in total**. |
| Geometric accuracy evaluation | Resampling, symmetric polyline distance, tangent agreement, endpoint distance, jitter comparison, completion and overshoot gates. |
| Score, stars, XP and gamification | Percentage score, 0–5 stars, lesson XP, levels every 150 XP, badges, streak tracking and animal friends. |
| Lesson progression and persistence | Lessons and worlds unlock in order; progress, attempts and settings survive refresh via `localStorage`. |
| Voice guidance | Spoken cues explain where to start, when to move to the next line, and the accuracy result with score-appropriate encouragement. |
| Mock/demo mode | An explicitly labelled simulator replays the lesson's own strokes with human-like wobble when no camera is available or for demonstration; demo playback is not scored as the child's attempt. |
| Parent dashboard | Accuracy trend, practice minutes, characters learned, completion, weak areas and recent attempts, computed locally. |
| Settings and accessibility | Sound/voice toggles, reduced-motion mode, child name, reset progress and parent dashboard link. |

## 4. Technologies used

These are the technologies actually present in `package.json` and the source tree.

**Application**

- **React 19** with function components and hooks.
- **TypeScript 5.8** (strict mode, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- **TanStack Start 1.x** — full-stack React framework used for SSR and file-based routing.
- **TanStack Router 1.x** — typed, file-based routes (`src/routes`), loaders and head metadata.
- **TanStack Query** — query client provider at the root, ready for data fetching (the
  current curriculum and progress layers are local).
- **Vite 8** — dev server and production build.
- **Tailwind CSS 4** (`@tailwindcss/vite`) with custom design tokens in `src/styles.css`.
- **Custom Tiny Trace UI components** (`src/components/ui-tt`) built with `class-variance-authority`, `clsx` and `tailwind-merge`.
- **lucide-react** icons.
- **Recharts** for the parent dashboard charts.
- **Nitro** as the server build target, with a custom SSR error wrapper in `src/server.ts`.

**Computer vision**

- **`@mediapipe/tasks-vision`** — `FilesetResolver` + `HandLandmarker` (VIDEO mode).
- Model asset: `public/models/hand_landmarker.task`; WASM runtime: `public/mediapipe/wasm/`.
- Both are served locally from `public/`; no remote model download is required at runtime.

**Build tooling**

- `@lovable.dev/vite-tanstack-config` — Vite configuration wrapper that supplies
  TanStack Start, React, Tailwind, tsconfig paths, deduplication and Nitro wiring. It is
  a required build dependency of `vite.config.ts` and is kept as-is.
- ESLint and Prettier configurations are included for code quality.

## 5. Architecture and data flow

```
Browser
  │
  ├── src/routes/__root.tsx        Root shell, providers, metadata, error + 404 screens
  │     ├── AppStateProvider       Progress state, hydration, persistence, XP/unlocks
  │     └── QueryClientProvider    TanStack Query context
  │
  ├── Routes (TanStack file-based)
  │     /                 Splash → onboarding or home
  │     /onboarding       Name + intro
  │     /home             Next trail, XP level, worlds, streak, badges, friends
  │     /journey          Full journey map / world list
  │     /world/$worldId   Lessons inside one world
  │     /lesson/$lessonId Guided tracing session
  │     /result           Score, stars, XP, unlocks, retry
  │     /rewards          Animals and achievements
  │     /profile          Jungle friends
  │     /settings         Sound, voice, motion, demo toggle, reset
  │     /parent           Parent dashboard
  │
  ├── Data        src/data/curriculum.ts (worlds, 53 lessons, animals, badges)
  │               src/data/strokes.ts    (normalized glyph templates + word composer)
  │
  ├── Vision      src/vision/*          VisionProvider abstraction
  │                 CameraVisionProvider      stream lifecycle only
  │                 MediaPipeVisionProvider   landmarks + pinch pen (extends camera)
  │                 MockVisionProvider        scripted demo path
  │                 provider-factory          UI never constructs a concrete provider
  │
  ├── Graphics    src/lib/geometry.ts   normalization, transforms, resampling, scoring
  │               src/components/air-writing/AirWritingCanvas.tsx   canvas renderer
  │               src/components/graphics/GhostGuide.tsx            reference layer
  │
  └── State       src/state/app-state.tsx + src/services/progressService.ts
                  localStorage persistence, unlocks, XP, badges, analytics
```

**Lesson data flow (one sample)**

```
<video> webcam frame
  → MediaPipe HandLandmarker.detectForVideo()
  → 21 landmarks, mirrored x → 1 − x
  → index fingertip projected into canvas drawing space
  → pinch state (isWriting) + normalized point
  → AirWritingCanvas commits strokes to a ref
  → evaluateTemplate(template, strokes) on finish
  → completeLesson(lessonId, accuracy, seconds)
  → progress updated + saved to localStorage
  → /result reads lastResult from AppState
```

**Coordinate pipeline**

```
camera pixels ──normalize──▶ normalized 0..1 (mirrored once) ──project──▶ surface space
                                                                              │
template strokes (0..1) ──transformPoint(padding)────────────────────────────▶ canvas px
```

The preview `<video>` uses `object-fit: cover`, so `projectToSurface()` undoes the
centre-crop and the canvas inset (`DRAWING_SURFACE_PADDING = 26`) every frame using the
live element geometry. The fingertip pointer, ink and ghost guide therefore share one
coordinate space, and horizontal motion feels natural to the child (their right hand
moves right on screen).

## 6. Computer graphics concepts and algorithms

**2D rendering and canvas pipeline.** The writing surface is an HTML `<canvas>` sized in
device pixels (`canvas.width = clientWidth × DPR`, capped at DPR 2) for crisp strokes.
All high-frequency coordinates live in refs, and a `requestAnimationFrame` loop clears
and redraws four layers each frame: ghost guide → finished strokes → live stroke →
fingertip pointer. React state is never set per frame.

**Coordinate transformations and normalized coordinates.** Every template is authored in
unit space (0..1 on both axes), independent of screen size, camera resolution and aspect
ratio. `normalizePoint` maps camera pixels into unit space; `transformPoint` maps unit
space into canvas pixels with padding. Because both the guide and the child's ink pass
through the same transform, alignment is resolution-independent.

**Alpha blending and layered rendering.** The ghost guide is rendered twice — a wide,
low-alpha halo (`ghostOpacity × 0.4`) under a crisp, slightly narrower line — so it stays
readable over bright camera content while the child's ink remains the brightest element.
`globalAlpha`, `lineCap: round` and `lineJoin: round` produce soft, child-friendly strokes.
The SVG guide layers completed strokes, the active dashed stroke and a pulsing start
marker in back-to-front order.

**Stroke rendering and smoothing.** Incoming fingertip samples are exponentially smoothed
(`lerpPoint`, α = 0.45) to reduce jitter. Committed polylines pass through a Chaikin-style
`smooth()` pass before rendering, while a 0.004 normalized-distance threshold removes
duplicate samples. A stroke is only committed when it contains more than three points.

**Geometric distance and shape comparison.** `distanceToSegment` computes point-to-segment
distance with a clamped projection. Templates and drawings are resampled to 48 evenly
spaced points by arc length (`resample`), then compared with a symmetric error: drawn →
guide distance uses a trimmed mean that ignores the worst 12 % of drawn points (so one
stray point cannot dominate), guide → drawn distance uses the plain mean (so skipped
sections do cost). The result maps through a Gaussian falloff
`exp(−(error / tolerance)²)` whose tolerance scales with the stroke's own size.

**Animation and layered rendering.** CSS/SVG animations (`animate-trace-dash`,
`animate-pulse-dot`, confetti, XP count-up, mascot poses) respect a `tt-reduced-motion`
class driven by the settings toggle. Transition and pop-in effects are CSS-only and never
block the drawing loop.

**Other geometry utilities.** Bounding box, polyline length, distance, scaling and
translation are used to compose word templates from letter glyphs and to compute
tolerance, closure detection and progress.

## 7. Project folder structure

```
tiny-trace/
├── public/
│   ├── favicon.svg / favicon.png / favicon.ico   Tiny Trace app icon
│   ├── mediapipe/wasm/                           Vendored MediaPipe WASM runtime
│   ├── models/hand_landmarker.task               Pre-trained hand-landmark model
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── air-writing/AirWritingCanvas.tsx      Real-time canvas renderer
│   │   ├── animals/                              Lion mascot + animal guides
│   │   ├── branding/                             Wordmark, trace mark, loader
│   │   ├── camera/CameraFeed.tsx                 Mirrored webcam preview + states
│   │   ├── dashboard/                            Parent dashboard cards + charts
│   │   ├── graphics/                             GhostGuide, stroke animator, confetti
│   │   ├── journey/                              Journey map
│   │   ├── lessons/                              Lesson header + guide panel
│   │   ├── navigation/                           Child top bar
│   │   ├── progress/                             Stars, XP bar, XP animation
│   │   ├── rewards/                              Reward cards + animal collection
│   │   └── ui-tt/TTButton.tsx                    Tiny Trace button variants
│   ├── data/
│   │   ├── curriculum.ts                         Worlds, 53 lessons, animals, badges
│   │   └── strokes.ts                            Normalized glyph templates
│   ├── lib/
│   │   ├── drawing-surface.ts                    Shared canvas inset
│   │   ├── geometry.ts                           Transforms, resampling, scoring
│   │   ├── types.ts                              Data model
│   │   ├── error-capture.ts / error-page.ts      SSR error handling
│   │   └── utils.ts                              `cn()` class helper
│   ├── routes/                                   File-based routes
│   ├── services/                                 Progress, lesson, analytics, voice
│   ├── state/app-state.tsx                       App-wide progress context
│   ├── vision/                                   VisionProvider implementations
│   ├── router.tsx / routeTree.gen.ts             Router setup (generated tree)
│   ├── server.ts / start.ts                      SSR entry + error normalization
│   └── styles.css                                Design tokens + Tailwind theme
├── eslint.config.js / prettierrc / prettierignore
├── package.json / package-lock.json / bun.lock
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 8. Installation

**Prerequisites**

- Node.js **20.19+** or **22.12+** (required by Vite 8) and npm.
- A modern Chromium-based browser, Firefox or Safari with WebAssembly support.
- A webcam for live hand tracking (optional — demo mode works without one).

**Steps**

```bash
git clone <repository-url>
cd tiny-trace
npm install
```

No environment variables, API keys or external services are required. The MediaPipe
runtime and model are already vendored under `public/`.

## 9. Running locally

```bash
# Development server with hot reload
npm run dev

# Type-check the project
npx tsc --noEmit

# Production build
npm run build

# Preview the production build
npm run preview
```

Open the URL printed by Vite (usually `http://localhost:5173` or
`http://localhost:3000`) in a browser. Use `localhost` rather than the machine's LAN IP:
browsers only grant camera access on secure origins (`https://` or `localhost`).

Other available scripts: `npm run lint` (ESLint) and `npm run format` (Prettier).

## 10. Webcam permission requirements

- The camera is requested **only after the child presses “Let's trace”** — never on page
  load, and never in the demo path.
- The browser shows its own permission prompt. If it is denied, the lesson shows a
  child-friendly message and offers the guided demo instead.
- Camera access requires a **secure context**: `https://` or `http://localhost`.
- Video is processed **entirely on the device**. No frames, landmarks or recordings are
  uploaded; there is no backend in this project.
- Ideal constraints are 960×720, front-facing camera. If the camera is busy, missing or
  blocked, the app reports the state instead of failing silently.
- Stopping a lesson releases every track so the camera indicator turns off.

## 11. How to use the application

1. **Start** on the splash screen; it leads to onboarding on first use, otherwise home.
2. **Onboarding** — enter the child's name and meet Rumi the lion cub.
3. **Home** — continue the next trail, see XP level, streak, badges and jungle friends.
4. **Journey / World** — pick an unlocked world and lesson. Worlds open when enough
   lessons in the previous world are finished; lessons open in order.
5. **Lesson**
   - Read the guide panel, then press **Let's trace**.
   - Allow camera access.
   - Hold one hand in view. Pinch thumb and index finger together to start a stroke,
     move along the ghost line, then release to finish the stroke.
   - Repeat for each stroke; press **I'm done** when finished.
   - Use **Start over** to clear the attempt, or **Use demo mode** to watch a simulated
     fingertip trace the character.
6. **Result** — see accuracy, stars, XP and any new unlocks; choose next trail or retry.
7. **Rewards / Profile** — view achievements, animal friends and progress.
8. **Parent dashboard** — open from the link at the bottom of home for accuracy trends,
   practice time, weak areas and recent attempts.
9. **Settings** — toggle sound, voice guidance, reduced motion and the saved demo
   preference, or reset progress.

## 12. Scoring system

Scoring is deterministic geometry implemented in `src/lib/geometry.ts`. It is **not** a
trained model and it does not use randomness or free points.

**Per-stroke components** (weights sum to 1):

| Component | Weight | Measurement |
| --- | --- | --- |
| Shape | 0.55 | Gaussian falloff of the symmetric distance between drawing and guide, blended 60/40 with how much of the guide was reached. |
| Direction | 0.17 | Mean tangent agreement measured at the nearest guide segment, so a closed shape may start anywhere but a backward stroke loses points. |
| Start point | 0.10 | Distance from the guide's first point (for closed guides, distance to the loop). |
| End point | 0.08 | Distance from the guide's last point. |
| Smoothness | 0.10 | Extra direction changes compared with the reference (jitter). |

The weighted result is then multiplied by:

- a **completion factor** (`0.5 + 0.5 × min(1, drawn/guide length)`), so half a stroke
  cannot score like a full one;
- an **overshoot factor**, which reduces the score when the drawn path is much longer than
  the guide (scribbling rather than tracing).

**Template-level adjustments**

- Each guide stroke takes the score of its best-matched drawn stroke; a missing stroke
  scores 0, so incomplete work is always penalised.
- **Stroke order**: up to a 12 % reduction when matched strokes are drawn in the wrong
  order.
- Shape lessons unlock in order after the child completes an attempt; there is no minimum
  accuracy threshold to continue.
- **Extra strokes**: −6 per substantial unmatched stroke, capped at −15.
- Accidental dots shorter than 0.025 normalized units are ignored.

**Stars** (`starsFor`)

| Accuracy | Stars |
| --- | --- |
| 95–100 | 5 |
| 86–94 | 4 |
| 74–85 | 3 |
| 60–73 | 2 |
| 40–59 | 1 |
| below 40 | 0 |

**XP** = `round(lessonXpReward × (0.6 + stars × 0.1))`.
Lesson rewards are 20 XP (strokes), 25 XP (shapes), 30 XP (numbers), 35 XP (letters) and
45 XP (words). A level is gained every 150 XP. Badges and animal friends unlock from
completed-lesson counts, high scores and streaks.

## 13. Progress storage

- Progress is stored in the browser's `localStorage` under the key
  **`tiny-trace:progress:v1`** by `src/services/progressService.ts`.
- The stored record contains: child name, XP, streak, last practice day, total practice
  seconds, per-lesson results (best accuracy, stars, attempts, completion date), earned
  badges, unlocked animals, the full attempt history and settings.
- On first load a small **seeded demo profile** is created (60 XP, a two-day streak and two
  completed stroke lessons) so the interface can be explored immediately. Resetting from
  Settings restores this seed.
- State hydrates after mount, so server rendering is never blocked by storage, and it is
  saved on every change. If storage is unavailable or corrupted, the app falls back to the
  default profile instead of crashing.
- Progress is **per browser profile and per device**. It does not sync between devices,
  and clearing site data erases it.
- Lesson unlocking is derived from completed lessons (`isWorldUnlocked`,
  `isLessonUnlocked`); no separate unlock flags are stored.

## 14. Team contributions

The following work breakdown is from the project team's contribution list:

| Activity | Rohini Pandya | Aditipriya Dubey | Zeel Shah |
| --- | :---: | :---: | :---: |
| Literature Survey | ✓ | ✓ |  |
| Hand Tracking and Gesture Recognition Module | ✓ | ✓ |  |
| Graphics Rendering Module | ✓ | ✓ |  |
| Shape Matching and Accuracy Evaluation |  | ✓ | ✓ |
| GUI Interface | ✓ | ✓ |  |
| Voice Feedback |  | ✓ | ✓ |
| Testing and Documentation | ✓ | ✓ | ✓ |


## 15. Limitations and future scope

**Known limitations**

- Hand tracking is sensitive to lighting, camera quality and background clutter; a hand
  that leaves the frame ends the current stroke.
- Only one hand and one fingertip are tracked, and only the index finger can draw.
- Pinch detection is heuristic (palm-normalized thresholds); very small or very large
  hands close to the camera can mis-trigger.
- Scoring compares paths, not letter correctness in a handwriting-pedagogy sense. It
  rewards following the guide; it does not assess letter formation theory.
- Progress is local to one browser/device; there is no account, cloud sync or backend.
- The default profile is seeded with demo progress and should be reset before a live demo
  if a clean start is required.
- The Settings page stores a demo-mode preference, but the lesson screen still starts in
  camera mode; demo mode is chosen per lesson with the **Use demo mode** button.
- The UI and voice guidance are English-only. Voice uses the browser's Web Speech API and
  depends on installed system voices.
- No automated test suite or CI pipeline exists; verification is manual plus the
  TypeScript and production build checks.
- MediaPipe runs on WASM/GPU and needs a reasonably modern browser; older low-end devices
  may see a lower frame rate.

**Future scope**

- Multi-hand and multi-finger input, plus stylus/touch fallback.
- Confidence-aware scoring with per-stroke feedback highlighting.
- Optional account sync and a teacher dashboard.
- Adaptive lesson ordering based on weak areas.
- Additional languages, lowercase letters and more vocabulary.
- A lightweight automated end-to-end test for the lesson flow.

## 16. Credits and third-party dependencies

**Vision**

- **MediaPipe Tasks Vision** (`@mediapipe/tasks-vision`) and the pre-trained
  **Hand Landmarker** model — Google MediaPipe, Apache License 2.0.
  <https://github.com/google-ai-edge/mediapipe>
- WASM runtime and model files are redistributed locally under
  `public/mediapipe/wasm/` and `public/models/`.

**Framework and libraries**

- [React](https://react.dev) — MIT
- [TanStack Start / Router / Query](https://tanstack.com) — MIT
- [Vite](https://vite.dev) — MIT
- [Tailwind CSS](https://tailwindcss.com) — MIT
- [lucide-react](https://lucide.dev) icons — ISC
- [Recharts](https://recharts.org) — MIT
- [class-variance-authority](https://cva.style) — Apache-2.0
- [Nitro](https://nitro.build) — MIT
- `@lovable.dev/vite-tanstack-config` — open-source Vite/TanStack Start build wrapper used
  by `vite.config.ts` (required build dependency, not application branding).

**Typefaces**

- *Baloo 2* and *Nunito*, served from Google Fonts under the SIL Open Font License.

**Artwork**

- The Tiny Trace wordmark, trace mark, lion mascot and animal characters are original
  inline SVG components in `src/components/branding` and `src/components/animals`.

Third-party licenses remain with their respective owners. Dependency license texts are
available in `node_modules/<package>/LICENSE` after `npm install`.

---

Tiny Trace was built as an academic project. It is a learning aid, not a medical,
diagnostic or handwriting-assessment tool.

## Project Members

| Member Name | Student ID | GitHub Profile |
| --- | --- | --- |
| Rohini Pandya | 24000053 | [Rohini Pandya](https://github.com/Rohini-Pandya) |
| Aditipriya Dubey | 24000069 | [Aditipriya Dubey](https://github.com/aditipriyadubey) |
| Zeel Shah | 24000184 | [Zeel Shah](https://github.com/zeels13) |
