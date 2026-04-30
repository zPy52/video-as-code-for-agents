import { z } from 'zod';
import { AbsoluteFill, interpolate } from 'remotion';
import type { TimelineProps } from '@/reel/component';
import { defineVideoComponent } from '@/reel/component';
import { useTimelineItem } from '@/reel/time';

export const logoSchema = z.object({
  src: z.string(),
  alt: z.string().default(''),
  width: z.number().default(160),
  position: z
    .enum(['top-left', 'top-right', 'bottom-left', 'bottom-right'])
    .default('top-right'),
  padding: z.number().default(48),
});

type LogoProps = z.input<typeof logoSchema> & TimelineProps;
type LogoPosition = NonNullable<LogoProps['position']>;

const POSITION_CLASS: Record<LogoPosition, string> = {
  'top-left': 'items-start justify-start',
  'top-right': 'items-start justify-end',
  'bottom-left': 'items-end justify-start',
  'bottom-right': 'items-end justify-end',
};

export function Logo(props: LogoProps) {
  const { localSeconds, duration } = useTimelineItem();
  const position = props.position ?? 'top-right';
  const padding = props.padding ?? 48;
  const width = props.width ?? 160;
  const alt = props.alt ?? '';

  const opacity = interpolate(
    localSeconds,
    [0, 0.3, duration - 0.3, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill
      className={`flex ${POSITION_CLASS[position]}`}
      style={{ padding }}
    >
      <img src={props.src} alt={alt} style={{ width, opacity }} />
    </AbsoluteFill>
  );
}

export default defineVideoComponent({
  name: 'Logo',
  description: 'Corner logo overlay with fade in/out.',
  schema: logoSchema,
  component: Logo,
});
