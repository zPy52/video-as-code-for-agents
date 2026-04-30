import { z } from 'zod';
import { AbsoluteFill, interpolate, spring } from 'remotion';
import type { TimelineProps } from 'video-as-code-for-agents';
import { defineVideoComponent } from 'video-as-code-for-agents';
import { useTimelineItem } from 'video-as-code-for-agents';

export const introSceneSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  background: z.string().default('#0b0b0f'),
  titleColor: z.string().default('#ffffff'),
  subtitleColor: z.string().default('#a0a0a8'),
});

type IntroSceneProps = z.input<typeof introSceneSchema> & TimelineProps;

export function IntroScene(props: IntroSceneProps) {
  const { localFrame, fps, localSeconds, duration } = useTimelineItem();
  const background = props.background ?? '#0b0b0f';
  const titleColor = props.titleColor ?? '#ffffff';
  const subtitleColor = props.subtitleColor ?? '#a0a0a8';

  const titleY = spring({
    frame: localFrame,
    fps,
    from: 40,
    to: 0,
    config: { damping: 18, stiffness: 110 },
  });

  const titleOpacity = interpolate(localSeconds, [0, 0.4], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const fadeOut = interpolate(
    localSeconds,
    [duration - 0.4, duration],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill
      className="items-center justify-center"
      style={{ background: background, opacity: fadeOut }}
    >
      <div
        className="text-center"
        style={{ transform: `translateY(${titleY}px)`, opacity: titleOpacity }}
      >
        <div
          className="text-7xl font-bold tracking-tight"
          style={{ color: titleColor }}
        >
          {props.title}
        </div>
        {props.subtitle ? (
          <div
            className="mt-4 text-2xl font-medium"
            style={{ color: subtitleColor }}
          >
            {props.subtitle}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
}

export default defineVideoComponent({
  name: 'IntroScene',
  description: 'Full-bleed intro with title, optional subtitle, and spring entrance.',
  schema: introSceneSchema,
  component: IntroScene,
});
