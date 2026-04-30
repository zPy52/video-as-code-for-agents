We want a small video-as-code SDK where a specialized coding agent composes videos by writing normal React JSX, with `<Video>` as the timeline boundary and every direct visual child scheduled by seconds.

The agent integration should not be an SDK feature. The product exposes a coding workspace plus a shell-capable MCP surface; the agent reads files, edits files, greps, installs packages with `pnpm`, runs validation commands, and renders the video by executing the project commands.

---

## Core Decision

Use Remotion as the renderer. The source of truth in v1 is `src/video.tsx`, not a separate JSON timeline.

```tsx
import { Video, Subtitle } from '@/reel';

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
        start={3.5}
        duration={2}
        zIndex={1}
        content="Multiple overlays can render at the same time"
      />
    </Video>
  );
}
```

Direct children of `<Video>` must be React elements with timeline props:

```ts
export type TimelineProps = {
  start: number; // seconds, can be fractional
  duration: number; // seconds
  zIndex: number; // overlay order, higher renders above lower
};

export type VideoProps = {
  width: number;
  height: number;
  fps: number;
  duration?: number; // seconds; defaults to max(child.start + child.duration)
  children: VideoChild | VideoChild[];
};

export type VideoChild<P = Record<string, unknown>> = React.ReactElement<P & TimelineProps>;
```

`zIndex` is required in v1 so every overlay has deterministic stacking. If the SDK later wants friendlier ergonomics, add a helper that defaults `zIndex` to `0` before children reach `<Video>`.

Do not create separate `Clip`, `Track`, or JSON timeline abstractions in v1. A clip is a scheduled React element.

---

## File Layout

```txt
my-video/
  remotion.config.ts
  tailwind.config.ts
  src/
    index.ts
    video.tsx
    components/
      IntroScene.tsx
      Subtitle.tsx
    reel/
      Video.tsx
      component.ts
      export-video.tsx
      registry.ts
      render.ts
      render-component.ts
      time.tsx
      validate.ts
      mcp.ts
    examples/
      subtitle-test.tsx
  out/
```

---

## Component API

Components are normal React components that accept `TimelineProps` plus their own props. They can use HTML, CSS imports, Tailwind classes, shadcn/ui, Magic UI, `motion/react`, SVG, canvas, images, video, and Remotion primitives.

Images and videos should work through ordinary JSX:

```tsx
<img src="https://example.com/photo.jpg" alt="" />
<video src="https://example.com/clip.mp4" />
```

For local assets, put files in a project asset directory such as `public/` and reference them with stable URLs or Remotion static-file helpers. Remote `src` URLs are allowed as long as the renderer can fetch them during preview and render.

```ts
// src/reel/component.ts
import type { ComponentType } from 'react';
import type { z } from 'zod';

export type TimelineProps = {
  start: number;
  duration: number;
  zIndex: number;
};

export type VideoComponent<TSchema extends z.ZodTypeAny = z.ZodTypeAny> = {
  name: string;
  description?: string;
  schema: TSchema;
  component: ComponentType<z.infer<TSchema> & TimelineProps>;
};

export function defineVideoComponent<TSchema extends z.ZodTypeAny>(
  input: VideoComponent<TSchema>,
) {
  return input;
}
```

```tsx
// src/components/Subtitle.tsx
import { z } from 'zod';
import { AbsoluteFill, interpolate } from 'remotion';
import { motion } from 'motion/react';
import type { TimelineProps } from '@/reel/component';
import { defineVideoComponent } from '@/reel/component';
import { useTimelineItem, useVideoConfig } from '@/reel/time';

export const subtitleSchema = z.object({
  content: z.string(),
  color: z.string().default('#fff'),
  fontSize: z.number().default(56),
  maxWidth: z.number().optional(),
});

type SubtitleProps = z.infer<typeof subtitleSchema> & TimelineProps;

export function Subtitle(props: SubtitleProps) {
  const { width } = useVideoConfig();
  const { localSeconds, duration } = useTimelineItem();
  const maxWidth = props.maxWidth ?? width * 0.72;
  const opacity = interpolate(
    localSeconds,
    [0, 0.25, duration - 0.25, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill className="items-center justify-end pb-24">
      <motion.div
        className="rounded-lg bg-black/70 px-6 py-3 text-center font-semibold"
        style={{ opacity, color: props.color, fontSize: props.fontSize, maxWidth }}
      >
        {props.content}
      </motion.div>
    </AbsoluteFill>
  );
}

export default defineVideoComponent({
  name: 'Subtitle',
  description: 'Centered subtitle with frame-driven fade.',
  schema: subtitleSchema,
  component: Subtitle,
});
```

Rule: `motion.div` is supported, but final-render animation must be derived from Remotion time (`useCurrentFrame`, `interpolate`, `spring`, or `useTimelineItem`). Avoid timers, CSS transitions, hover states, unseeded randomness, and wall-clock Motion timelines for MP4 output.

---

## `<Video>` Timeline Boundary

`<Video>` normalizes children, validates timeline props, sorts by `zIndex` then source order, and renders each child in a Remotion `<Sequence>`.

Remotion docs confirm that `<Sequence from durationInFrames>` time-shifts children, unmounts them after `durationInFrames`, and makes `useCurrentFrame()` relative to the sequence. `<Composition>` supplies `width`, `height`, `fps`, and `durationInFrames`.

```tsx
// src/reel/Video.tsx
import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import type { TimelineProps } from '@/reel/component';
import { TimelineItemProvider } from '@/reel/time';

export type VideoProps = {
  width: number;
  height: number;
  fps: number;
  duration?: number;
  children: React.ReactNode;
};

type ScheduledChild = {
  key: React.Key;
  element: React.ReactElement<TimelineProps>;
  props: TimelineProps;
  index: number;
};

export function secondsToFrames(seconds: number, fps: number) {
  return Math.round(seconds * fps);
}

export function collectScheduledChildren(children: React.ReactNode): ScheduledChild[] {
  return React.Children.toArray(children).map((child, index) => {
    if (!React.isValidElement<TimelineProps>(child)) {
      throw new Error('<Video> children must be React elements with start, duration, and zIndex.');
    }

    const { start, duration, zIndex } = child.props;
    if (!Number.isFinite(start) || start < 0) throw new Error('Video child start must be >= 0.');
    if (!Number.isFinite(duration) || duration <= 0) throw new Error('Video child duration must be > 0.');
    if (!Number.isInteger(zIndex)) throw new Error('Video child zIndex must be an integer.');

    return { key: child.key ?? index, element: child, props: { start, duration, zIndex }, index };
  });
}

export function getVideoDuration(children: React.ReactNode, explicitDuration?: number) {
  if (explicitDuration !== undefined) return explicitDuration;
  const scheduled = collectScheduledChildren(children);
  return Math.max(1, ...scheduled.map((c) => c.props.start + c.props.duration));
}

export function Video(props: VideoProps) {
  const scheduled = collectScheduledChildren(props.children).sort(
    (a, b) => a.props.zIndex - b.props.zIndex || a.index - b.index,
  );

  return (
    <AbsoluteFill>
      {scheduled.map(({ key, element, props: timing }) => (
        <Sequence
          key={key}
          from={secondsToFrames(timing.start, props.fps)}
          durationInFrames={secondsToFrames(timing.duration, props.fps)}
          style={{ zIndex: timing.zIndex }}
        >
          <TimelineItemProvider {...timing} fps={props.fps}>
            {element}
          </TimelineItemProvider>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
```

---

## Time API

Expose seconds to component authors. Convert seconds to frames only at the Remotion boundary.

```tsx
// src/reel/time.tsx
import { createContext, useContext, type PropsWithChildren } from 'react';
import { useCurrentFrame, useVideoConfig as useRemotionVideoConfig } from 'remotion';
import type { TimelineProps } from '@/reel/component';

type TimelineItem = TimelineProps & { fps: number };
const TimelineItemContext = createContext<TimelineItem | null>(null);

export function TimelineItemProvider(props: PropsWithChildren<TimelineItem>) {
  const { children, ...value } = props;
  return <TimelineItemContext.Provider value={value}>{children}</TimelineItemContext.Provider>;
}

export function useVideoConfig() {
  const c = useRemotionVideoConfig();
  return { width: c.width, height: c.height, fps: c.fps, duration: c.durationInFrames / c.fps };
}

export function useTimelineItem() {
  const item = useContext(TimelineItemContext);
  if (!item) throw new Error('useTimelineItem() must be called inside <Video>.');
  const frame = useCurrentFrame();
  return {
    start: item.start,
    duration: item.duration,
    zIndex: item.zIndex,
    fps: item.fps,
    localFrame: frame,
    localSeconds: frame / item.fps,
  };
}
```

---

## Entrypoint Composition

The project author should not create a separate `Root.tsx`. `src/index.ts` is the Remotion entrypoint and calls `exportVideo(VideoSource)`. `exportVideo()` derives the internal Remotion root from the passed video component, calculates one `Composition`, and registers it.

`VideoSource` must be a pure function that immediately returns `<Video>`; do not call React hooks or perform side effects before returning it. This keeps metadata extraction deterministic.

```tsx
// src/reel/export-video.tsx
import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { getVideoDuration, secondsToFrames, type VideoProps } from '@/reel/Video';

export type VideoSourceComponent = () => React.ReactElement<VideoProps>;

export function createRoot(VideoSource: VideoSourceComponent) {
  const videoElement = VideoSource();
  const { width, height, fps, duration, children } = videoElement.props;
  const durationSeconds = getVideoDuration(children, duration);

  return function Root() {
    return (
      <Composition
        id="main"
        component={VideoSource}
        width={width}
        height={height}
        fps={fps}
        durationInFrames={secondsToFrames(durationSeconds, fps)}
      />
    );
  };
}

export function exportVideo(VideoSource: VideoSourceComponent) {
  registerRoot(createRoot(VideoSource));
}
```

```ts
// src/index.ts
import { exportVideo } from '@/reel/export-video';
import Video from '@/video';

exportVideo(Video);
```

`createRoot()` remains exported for tests and advanced integration, but normal projects should call only `exportVideo()`.

---

## Registry

Keep explicit registry imports for agent discovery and schema validation. The registry does not own the timeline.

```ts
// src/reel/registry.ts
import Subtitle from '@/components/Subtitle';
import IntroScene from '@/components/IntroScene';

export const registry = {
  IntroScene,
  Subtitle,
};
```

Library adapters wrap external components in the same API and must include `TimelineProps` even if they do not read those props.

---

## Project Commands

The project should expose commands, not an agent API. The coding agent can call these commands through the shell and repair files based on the output.

```json
{
  "scripts": {
    "dev": "remotion studio src/index.ts",
    "typecheck": "tsc --noEmit",
    "validate": "tsx src/reel/validate.ts",
    "render": "tsx src/reel/render.ts",
    "test:component": "tsx src/reel/render-component.ts"
  }
}
```

Validation:

- `src/index.ts` calls `exportVideo(VideoSource)`.
- `src/video.tsx` default export returns exactly one `<Video>`.
- `<Video width height fps>` are positive integers.
- every direct visual child has `start >= 0`, `duration > 0`, and integer `zIndex`.
- fragments and non-visual wrapper elements are not allowed as direct `<Video>` children in v1.
- child component names exist in `registry`.
- child non-timeline props pass the registered component schema.
- `duration` is either omitted or covers the final scheduled child.
- `pnpm typecheck` succeeds.
- `pnpm validate` validates the `<Video>` contract.

---

## MCP Surface

MCP does not need video-specific authoring tools in v1. It only needs to expose a constrained coding-agent workspace:

| Capability | Purpose |
|---|---|
| read file | Inspect `src/video.tsx`, components, config, and command output artifacts. |
| write file / patch file | Edit `src/video.tsx`, create components, update styles, and add assets metadata. |
| grep / search | Discover components, registry entries, props, and examples. |
| list files | Understand project structure and available assets. |
| shell command | Run `pnpm install`, `pnpm add`, `pnpm typecheck`, `pnpm validate`, `pnpm render`, and focused component tests. |

The shell tool is the important primitive. The coding agent should be able to run ordinary commands such as:

```sh
pnpm install
pnpm add motion lucide-react
pnpm typecheck
pnpm validate
pnpm render -- --entry src/index.ts --out out/main.mp4
pnpm test:component -- Subtitle --props '{"content":"Hello","start":0,"duration":3,"zIndex":0}' --out out/subtitle-test.mp4
```

The MCP host can still sandbox, time-limit, and log shell commands, but it should not require the SDK to expose `read_video_source`, `write_video_source`, `render_video`, or an AI SDK adapter. The agent already has the right abstraction: it is a coding agent.

---

## Render

```ts
// src/reel/render.ts
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

export async function renderVideo(projectRoot: string, outputName = 'main.mp4') {
  const serveUrl = await bundle({ entryPoint: path.join(projectRoot, 'src/index.ts') });
  const composition = await selectComposition({ serveUrl, id: 'main' });
  const outputLocation = path.join(projectRoot, 'out', outputName);

  await renderMedia({ serveUrl, composition, codec: 'h264', outputLocation });
  return { outputLocation };
}
```

`src/index.ts` remains the render entrypoint. A command can bundle that entrypoint, render the `main` composition, and write to `out/`.

The CLI wrapper should accept an output path:

```sh
pnpm render -- --entry src/index.ts --out out/main.mp4
```

---

## Component Test Render

Agents need a fast way to test a component in isolation before placing it in the final timeline. Add a component-test command that renders one registered component over a deterministic background.

Example:

```sh
pnpm test:component -- Subtitle \
  --props '{"content":"Test subtitle","start":0,"duration":3,"zIndex":0}' \
  --background black \
  --duration 3 \
  --out out/subtitle-test.mp4
```

This command should:

- load the component from `registry`.
- validate props against the component schema plus `TimelineProps`.
- create a temporary `<Video width height fps duration>` with a black or configurable background.
- render the component through the same `<Video>` and Remotion path used by the real video.
- write the result to `out/`.

This gives the agent a good DX loop: create or edit a component, render it alone, inspect errors or output, then compose it into `src/video.tsx`.

---

## Agent Workflow

The agent is a specialized coding agent, not a caller of video-specific SDK tools.

1. Inspect the project with `ls`, `rg`, and file reads.
2. Read `src/video.tsx`, `src/reel/registry.ts`, and relevant components.
3. Reuse components when possible.
4. Create or edit components when a missing visual unit is needed.
5. Test new or risky components in isolation with `pnpm test:component`.
6. Edit `src/video.tsx` with a complete `<Video>` tree.
7. Run `pnpm typecheck` and `pnpm validate`.
8. Render with `pnpm render -- --entry src/index.ts --out out/main.mp4`.
9. Patch and rerender on build, validation, or visual-test errors.

Workflow: the agent edits `src/video.tsx`, schedules each visual element with `start`, `duration`, and `zIndex`, keeps `src/index.ts` as `exportVideo(Video)`, validates that JSX against the registry schemas, then Remotion renders each child through a `<Sequence>` at `start * fps` for `duration * fps` frames.

---

## Implementation Order

1. Scaffold Remotion + React + Tailwind.
2. Add `TimelineProps`, `defineVideoComponent`, and `Video`.
3. Add `time.tsx`.
4. Add `exportVideo()` that derives composition metadata from the passed `VideoSource` and registers an internal root.
5. Add explicit `registry.ts`.
6. Add `Subtitle`, `IntroScene`, `Logo`, `LowerThird`.
7. Add JSX validation command.
8. Add render command that writes to `out/`.
9. Add isolated component-test render command.
10. Add MCP shell/file/search workspace capabilities.
11. Test child validation, schema validation, z-index ordering, derived duration, seconds-to-frames conversion, render output paths, and component-test rendering.

---

## Non-Goals

- no custom renderer
- no AST registry generator
- no video-specific AI SDK tool adapter in v1
- no SDK-level agent orchestration in v1
- no required multi-track model
- no separate `Clip` abstraction
- no JSON timeline source of truth in v1
- no non-React runtime in v1
