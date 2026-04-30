# video-as-code-for-agents

[GitHub](https://github.com/zPy52/video-as-code-for-agents) · [npm](https://www.npmjs.com/package/video-as-code-for-agents)

You just write JSX, put scheduled components directly under `<Video>`, and let the timeline live in the code instead of in a separate JSON file or editor export. 

## Quick Start

The main video entry point lives in [`src/video.tsx`](./src/video.tsx).

```tsx
import { Video } from '@/reel/Video';
import { Subtitle } from '@/components/Subtitle';
import { PresenterCard } from '@/components/PresenterCard';

export default function MyVideo() {
  return (
    <Video width={1080} height={720} fps={24}>
      <Subtitle
        start={0}
        duration={3}
        zIndex={0}
        content="This is the subtitle of this frame"
      />
      <Subtitle
        start={1}
        duration={2}
        zIndex={1}
        content="Multiple overlays can render at the same time"
      />
      <PresenterCard
        start={4}
        duration={5}
        zIndex={2}
        name="Aaron Epstein"
        title="Group Partner, Y Combinator"
      />
    </Video>
  );
}
```

You can use any of your favourite tools like Tailwind, CSS, motion, Remotion and any other that's supported by React. You make components using JSX and HTML within a `<Video>` that defines the timeline boundary.

Then render it:

```bash
pnpm render
```

Preview it in Remotion Studio:

```bash
pnpm dev
```

Of course, to install it's just running either of:

```bash
npm install video-as-code-for-agents
pnpm install video-as-code-for-agents
```

## How It Works

### `src/video.tsx`

This is the source of truth for the composition. The default export should return exactly one `<Video>` element.

If you omit the `duration` prop on `<Video>`, the runtime uses the latest scheduled child end time.

### `src/index.ts`

This file is the Remotion entry point. It calls `exportVideo(Video)` so the bundler can find the composition root.

### `src/reel/Video.tsx`

`<Video>` does three important things:

1. normalizes the children,
2. validates `start`, `duration`, and `zIndex`,
3. renders each scheduled child inside a Remotion `<Sequence>`.

Children are sorted by `zIndex`, then by source order, so stacking stays deterministic.

### Timing model

All timing is expressed in seconds.

- `start` can be fractional.
- `duration` can be fractional.
- `zIndex` must be an integer.

Inside a scheduled child, the current frame is local to that child. That is what makes entrance and exit animations feel natural when the same component is reused at different points in the video.

## Timeline Props

Every direct child of `<Video>` must accept these props:

```ts
export type TimelineProps = {
  start: number;
  duration: number;
  zIndex: number;
};
```

If you add a custom component, make sure it accepts `TimelineProps` plus whatever props it needs for its own content.

## Built-In Components

The package ships with a small set of reusable components in `src/components/`:

- `IntroScene` - full-bleed intro card with title and optional subtitle.
- `Logo` - corner logo overlay with a simple fade.
- `LowerThird` - name plate with an accent bar and optional title.
- `PresenterCard` - wipe-in presenter card with a stronger editorial look.
- `Subtitle` - centered subtitle overlay with a frame-driven fade.

These are regular React components, not special timeline primitives.

## Writing Your Own Component

Custom components are defined with a Zod schema and registered in `src/reel/registry.ts`.

```tsx
import { z } from 'zod';
import { AbsoluteFill } from 'remotion';
import type { TimelineProps } from '@/reel/component';
import { defineVideoComponent } from '@/reel/component';
import { useTimelineItem } from '@/reel/time';

const titleSchema = z.object({
  text: z.string(),
});

type TitleProps = z.input<typeof titleSchema> & TimelineProps;

export function Title(props: TitleProps) {
  const { localSeconds } = useTimelineItem();

  return (
    <AbsoluteFill>
      <div style={{ opacity: localSeconds > 0.25 ? 1 : localSeconds / 0.25 }}>
        {props.text}
      </div>
    </AbsoluteFill>
  );
}

export default defineVideoComponent({
  name: 'Title',
  schema: titleSchema,
  component: Title,
});
```

After that, add the component to the registry:

```ts
import { Title } from '@/components/Title';

export const registry = {
  // ...
  Title,
} as const;
```

## Rendering and Validation

### Validation

Run validation before rendering:

```bash
pnpm validate
```

Validation checks that:

- `src/video.tsx` returns a `<Video>` element,
- the direct children are registered components,
- timeline props are valid,
- component props match the registered Zod schema,
- and an explicit `duration` covers the last scheduled child.

### Rendering

Render the default composition to `out/main.mp4`:

```bash
pnpm render
```

Render a different entry file or output path:

```bash
pnpm render -- --entry src/index.ts --out out/custom.mp4
```

### Component previews

You can render a single registered component with test props:

```bash
pnpm test:component PresenterCard --props '{"name":"Aaron Epstein","title":"Group Partner, Y Combinator"}'
```

That is handy when you want to tune one overlay without rendering the whole sequence.

## Scripts

The package exposes a small set of scripts:

```json
{
  "dev": "remotion studio src/index.ts",
  "typecheck": "tsc --noEmit",
  "validate": "tsx src/reel/validate.ts",
  "render": "tsx src/reel/render.ts",
  "test:component": "tsx src/reel/render-component.ts",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

## Project Layout

```txt
src/
  index.ts
  video.tsx
  components/
  reel/
  examples/
out/
```

The repository uses the `@/* -> src/*` alias, so imports stay short and readable.

## Good Practices

- Keep final-render animation tied to Remotion time.
- Use `useTimelineItem()` when a component needs its local frame or local seconds.
- Prefer registered components under `<Video>` over ad hoc DOM nodes.
- Keep `zIndex` explicit so overlaps stay predictable.
- Treat `src/video.tsx` as the one place where the story of the video is assembled.

## Example Workflow

1. Sketch the composition in `src/video.tsx`.
2. Add or reuse a component from `src/components/`.
3. Register any new component in `src/reel/registry.ts`.
4. Run `pnpm validate`.
5. Preview with `pnpm dev`.
6. Render with `pnpm render`.

## Notes

- Animations that depend on `setTimeout`, CSS transitions, hover states, or wall-clock time will not be deterministic in exported MP4s.
- Direct children of `<Video>` should be registered React components, not fragments or plain DOM elements.
- The package is built around Remotion, so if you already know React, most of the learning curve is just the timeline model.
