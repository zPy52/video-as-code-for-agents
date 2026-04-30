import { z } from 'zod';
import { AbsoluteFill, interpolate, spring } from 'remotion';
import type { TimelineProps } from '@/reel/component';
import { defineVideoComponent } from '@/reel/component';
import { useTimelineItem } from '@/reel/time';

export const lowerThirdSchema = z.object({
  name: z.string(),
  title: z.string().optional(),
  accent: z.string().default('#3b82f6'),
  background: z.string().default('rgba(0, 0, 0, 0.7)'),
  textColor: z.string().default('#ffffff'),
});

type LowerThirdProps = z.input<typeof lowerThirdSchema> & TimelineProps;

export function LowerThird(props: LowerThirdProps) {
  const { localFrame, fps, localSeconds, duration } = useTimelineItem();
  const accent = props.accent ?? '#3b82f6';
  const background = props.background ?? 'rgba(0, 0, 0, 0.7)';
  const textColor = props.textColor ?? '#ffffff';

  const x = spring({
    frame: localFrame,
    fps,
    from: -400,
    to: 0,
    config: { damping: 20, stiffness: 120 },
  });

  const opacity = interpolate(
    localSeconds,
    [0, 0.25, duration - 0.3, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill className="items-start justify-end pb-32 pl-16">
      <div
        className="flex items-stretch overflow-hidden rounded-md"
        style={{ background: background, transform: `translateX(${x}px)`, opacity }}
      >
        <div style={{ width: 6, background: accent }} />
        <div className="px-6 py-3" style={{ color: textColor }}>
          <div className="text-3xl font-semibold leading-tight">{props.name}</div>
          {props.title ? (
            <div className="mt-1 text-lg opacity-80">{props.title}</div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
}

export default defineVideoComponent({
  name: 'LowerThird',
  description: 'Slide-in lower-third name plate with optional title.',
  schema: lowerThirdSchema,
  component: LowerThird,
});
