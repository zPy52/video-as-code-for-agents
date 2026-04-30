import { z } from 'zod';
import { AbsoluteFill, interpolate } from 'remotion';
import { motion } from 'motion/react';
import type { TimelineProps } from 'video-as-code-for-agents';
import { defineVideoComponent } from 'video-as-code-for-agents';
import { useTimelineItem, useVideoConfig } from 'video-as-code-for-agents';

export const subtitleSchema = z.object({
  content: z.string(),
  color: z.string().default('#fff'),
  fontSize: z.number().default(56),
  maxWidth: z.number().optional(),
});

type SubtitleProps = z.input<typeof subtitleSchema> & TimelineProps;

export function Subtitle(props: SubtitleProps) {
  const { width } = useVideoConfig();
  const { localSeconds, duration } = useTimelineItem();
  const color = props.color ?? '#fff';
  const fontSize = props.fontSize ?? 56;
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
        style={{ opacity, color, fontSize, maxWidth }}
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
