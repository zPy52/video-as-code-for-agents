# video-as-code-for-agents

SDK source for building Remotion videos from plain React components.

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
