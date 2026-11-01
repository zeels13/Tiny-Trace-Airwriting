# Tiny Trace — Handoff

**Status:** Code complete and submission-ready. The only outstanding work is a manual,
hardware-dependent verification pass before presenting the project.

**Build state:** `npx tsc --noEmit` passes; `npm run build` passes; all 53 lesson routes
and every main page returned HTTP 200 in a dev-server smoke test.

## Before the demo

```bash
npm install
npm run dev
# open the printed localhost URL (not the LAN IP — camera needs a secure origin)
```

If you want a clean first run, open **Settings → Reset progress**. The app otherwise seeds
a small demo profile (60 XP, two completed lessons, two-day streak).

## Manual checklist (needs a real webcam)

- [ ] Camera permission is requested only after **Let's trace**.
- [ ] Hand landmarks load; status reads "I can see you!".
- [ ] Pinch starts a stroke; release ends it; next pinch starts a new stroke.
- [ ] Left/right movement is not reversed; fingertip, ink and ghost guide line up.
- [ ] Multiple strokes are stored separately.
- [ ] Moving the hand out of frame ends the stroke, hides the pointer and commits no stale ink.
- [ ] **Use demo mode** replays the character and scores the attempt.
- [ ] Score, stars, XP and the "areas to revisit" tip look correct.
- [ ] Finish / I'm done / Start over / Try again all behave correctly.
- [ ] Empty attempts cannot be finished.
- [ ] Stars, badges, animals and the next world unlock as expected.
- [ ] Refreshing the page keeps XP, stars and unlocks.
- [ ] Parent dashboard and result screen show the stored figures.
- [ ] Layout works at phone, tablet and desktop widths.

## Things not to break

- Do **not** delete `public/mediapipe/wasm/` or `public/models/hand_landmarker.task` —
  hand tracking depends on both being served locally.
- Do **not** remove `@lovable.dev/vite-tanstack-config` from `devDependencies` without
  rewriting `vite.config.ts`; it supplies the TanStack Start / React / Tailwind / Nitro
  build wiring.
- `src/routeTree.gen.ts` is generated. Add routes as files in `src/routes/` instead of
  editing it.
- Progress is stored under the `tiny-trace:progress:v1` localStorage key; changing the
  `Progress` shape requires handling older saved records.

Full documentation: `README.md`. Phase-by-phase status and limitations:
`PROJECT_FINAL_STATUS.md`.
