# video-as-code-for-agents

SDK source for building Remotion videos from plain React components.

The root package is only the toolkit. Put actual video projects in a consumer
folder such as `my-videos/`.

## Root SDK

`src/` exports the authoring and rendering API:

```ts
export { Video } from 'video-as-code-for-agents';
export { exportVideo } from 'video-as-code-for-agents';
export { defineVideoComponent, useTimelineItem } from 'video-as-code-for-agents';
```

The root package no longer contains a demo `src/video.tsx`, `src/components/`,
or `src/examples/`.

## Consumer Project

`my-videos/` is the example/personal project. It owns:

```txt
my-videos/src/index.ts
my-videos/src/video.tsx
my-videos/src/components/
```

Render from there:

```bash
cd my-videos
pnpm render
```

That script runs:

```bash
video-as-code-render
```

You can also choose an output path:

```bash
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

Then schedule components in `my-videos/src/video.tsx`:

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
