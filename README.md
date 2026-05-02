# video-as-code-for-agents

SDK source for building Remotion videos from plain React components.

## Quickstart

**1. Create a project and install the SDK**

```bash
mkdir my-videos && cd my-videos
npm init -y
npm install video-as-code-for-agents remotion react react-dom
```

**2. Write your video** (`src/video.tsx`)

```tsx
import { Video, MediaVideo } from 'video-as-code-for-agents';

export default function MyVideo() {
  return (
    <Video width={1080} height={720} fps={24} duration={7}>
      <MediaVideo
        start={0}
        duration={7}
        zIndex={0}
        src="./in/clip.mp4"
      />
    </Video>
  );
}
```

**3. Register and render** (`src/index.ts`)

```ts
import Video from './video';
import { exportVideo } from 'video-as-code-for-agents';

exportVideo(Video);
```

```bash
npx video-as-code-render
# → out/main.mp4
```

---

The root package is only the toolkit. Put actual video projects in a consumer folder such as `example/`.

## Root SDK

`src/` exports the authoring and rendering API:

```ts
export { Video } from 'video-as-code-for-agents';
export { exportVideo } from 'video-as-code-for-agents';
export { defineVideoComponent, useTimelineItem } from 'video-as-code-for-agents';
```

The root package no longer contains a demo `src/video.tsx`, `src/components/`, or `src/examples/`.

## Consumer Project

`example/` is the example/personal project. It owns:

```txt
example/src/index.ts
example/src/video.tsx
example/src/components/
```

The video entry point only registers the composition:

```ts
import Video from './video';
import { exportVideo } from 'video-as-code-for-agents';

exportVideo(Video);
```

Render from the consumer project with the video renderer:

```bash
cd example
pnpm render
```

The consumer `render` script runs the package-provided renderer:

```bash
video-as-code-render
```

By default it renders `src/index.ts` to `out/main.mp4`. You can also choose an entry file or output path:

```bash
pnpm render -- --entry src/index.ts
pnpm render -- --out out/custom.mp4
```

## Component Shape

Video components are normal React components with timeline props:

```tsx
import { z } from 'zod';
import { AbsoluteFill } from 'remotion';
import {
  defineVideoComponent,
  type TimelineProps,
  useTimelineItem,
} from 'video-as-code-for-agents';

const titleSchema = z.object({
  text: z.string(),
});

type TitleProps = z.input<typeof titleSchema> & TimelineProps;

export function Title(props: TitleProps) {
  const { localSeconds } = useTimelineItem();

  return (
    <AbsoluteFill>
      <div style={{ opacity: Math.min(1, localSeconds / 0.25) }}>
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

Then schedule components in `example/src/video.tsx`:


```tsx
import { Video } from 'video-as-code-for-agents';
import { Title } from './components/Title';

export default function MyVideo() {
  return (
    <Video width={1080} height={720} fps={24}>
      <Title start={0} duration={3} zIndex={0} text="Hello" />
    </Video>
  );
}
```

## Built-in Components

### MediaVideo

`MediaVideo` is a full-frame video layer that renders a local or remote video source. It is included in the package and requires no extra setup.

```tsx
import { Video, MediaVideo } from 'video-as-code-for-agents';

export default function MyVideo() {
  return (
    <Video width={1920} height={1080} fps={30}>
      <MediaVideo
        start={0}
        duration={10}
        zIndex={0}
        src="./in/clip.mp4"
        fit="cover"   // 'cover' (default) | 'contain'
      />
    </Video>
  );
}
```

**Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | — | Path or URL to the video file |
| `fit` | `'cover' \| 'contain'` | `'cover'` | How the video fills the frame |
| `zoom` | `ZoomEffectConfig` | — | Optional zoom effect (see below) |

## Zoom Effect

The zoom effect lets you define cinematic zoom in / zoom out moves at arbitrary keyframes with custom easing, transition durations, hold windows, and motion blur.

### `<ZoomEffect>` wrapper

Use `<ZoomEffect>` to apply zoom to any content:

```tsx
import { ZoomEffect } from 'video-as-code-for-agents';

<ZoomEffect
  keyframes={[
    { at: 0,   scale: 1 },
    { at: 1,   scale: 1.8, origin: [0.3, 0.4],
      transition: { duration: 0.6, easing: 'easeInOut' } },
    { at: 3,   scale: 1.8 },                                       // hold
    { at: 4,   scale: 1,   transition: { duration: 1, easing: 'easeOut' } },
    { at: 5.5, scale: 2.5, transition: { duration: 0 } },          // instantaneous cut
  ]}
  motionBlur={{ strength: 1, max: 18 }}
>
  {/* any children */}
</ZoomEffect>
```

### Inline on `MediaVideo`

Pass a `zoom` prop directly on `MediaVideo` for convenience:

```tsx
<MediaVideo
  start={0}
  duration={8}
  zIndex={0}
  src="./in/clip.mp4"
  zoom={{
    keyframes: [
      { at: 0, scale: 1 },
      { at: 1, scale: 2, origin: [0.5, 0.5], transition: { duration: 0.5, easing: 'easeIn' } },
      { at: 5, scale: 2 },
      { at: 6, scale: 1, transition: { duration: 1, easing: 'easeOut' } },
    ],
    motionBlur: true,
  }}
/>
```

### Keyframe model

Each keyframe defines **when a transition starts**, its target scale, and how to get there. Hold is implicit — scale stays at the previous target until the next keyframe's `at`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `at` | `number` | — | Local seconds at which the transition **starts** |
| `scale` | `number` | `1` | Target scale factor (`1` = no zoom) |
| `origin` | `[number, number]` | `[0.5, 0.5]` | Zoom pivot as `[x, y]` in 0–1 normalized coords |
| `transition.duration` | `number` | `0` | Seconds to reach this scale (`0` = instantaneous) |
| `transition.easing` | `EasingSpec` | `'easeInOut'` | Easing function (see below) |

Keyframes must be sorted by `at` in strictly increasing order.

### Easing

`easing` accepts a named preset or a custom cubic-bezier:

```ts
type EasingSpec =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | [x1: number, y1: number, x2: number, y2: number]; // cubic-bezier

// Example
{ transition: { duration: 0.4, easing: [0.25, 0.1, 0.25, 1] } }
```

### Motion blur

Motion blur is velocity-driven: blur intensity is proportional to how fast the scale is changing per frame. It has zero cost during holds.

```ts
motionBlur?: boolean | { strength?: number; max?: number }
// boolean true   → strength: 1, max: 20px
// object         → custom strength multiplier and pixel clamp
```

### Utility exports

For advanced use you can import the pure helpers directly:

```ts
import {
  getZoomState,     // (seconds, keyframes) → { scale, origin }
  getZoomStyle,     // (input) → CSSProperties with transform + blur
  resolveZoomKeyframes,
  resolveEasing,
  zoomEffectSchema,
  zoomKeyframeSchema,
} from 'video-as-code-for-agents';
```
