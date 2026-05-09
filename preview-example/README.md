# preview-example

Minimal Next.js (App Router) site that mounts the Aaron Epstein composition
inside the SDK's `<Preview>` component.

## Run

```sh
cd preview-example
npm install
npm run dev
```

Open http://localhost:3000.

## Build

```sh
npm run build
npm run start
```

## What's here

- `app/components/AaronVideo.tsx` — the composition (same as `example/src/video.tsx`)
- `app/components/PresenterCard.tsx`, `Highlight.tsx` — copied verbatim from `example/`
- `app/components/PreviewStage.tsx` — `'use client'` wrapper around `<Preview>`
- `app/page.tsx` / `app/layout.tsx` — the editorial-gallery page chrome
- `app/globals.css` — the design system (paper, ink, accent, grain, reveal motion)

## Notes

- The SDK is linked via `"video-as-code-for-agents": "file:.."` and transpiled by Next
  through `transpilePackages` in [next.config.mjs](next.config.mjs).
- React, React-DOM, and the Remotion family are pinned to the same versions as the
  repo root to avoid duplicate-React errors in `@remotion/player`.
