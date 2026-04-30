import { z } from 'zod';
import { AbsoluteFill, interpolate } from 'remotion';
import { useTimelineItem } from 'video-as-code-for-agents';
import type { TimelineProps } from 'video-as-code-for-agents';
import { defineVideoComponent } from 'video-as-code-for-agents';

export const highlightSchema = z.object({
  text: z.string(),
  background: z.string().default('#F26625'),
  color: z.string().default('#ffffff'),
  fontSize: z.number().default(96),
  typeInSeconds: z.number().default(0.6),
  typeOutSeconds: z.number().default(0.5),
});

type HighlightProps = z.input<typeof highlightSchema> & TimelineProps;

export function Highlight(props: HighlightProps) {
  const { localSeconds, duration } = useTimelineItem();
  const background = props.background ?? '#F26625';
  const color = props.color ?? '#ffffff';
  const fontSize = props.fontSize ?? 96;
  const typeIn = props.typeInSeconds ?? 0.6;
  const typeOut = props.typeOutSeconds ?? 0.5;
  const length = props.text.length;

  const inProgress = interpolate(localSeconds, [0, typeIn], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const outProgress = interpolate(
    localSeconds,
    [Math.max(0, duration - typeOut), duration],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const inEnd = Math.ceil(inProgress * length);
  const outEnd = Math.ceil((1 - outProgress) * length);
  const visible = props.text.slice(0, Math.min(inEnd, outEnd));

  return (
    <AbsoluteFill className="items-center justify-end pb-20">
      <span
        className="font-sans font-bold leading-none"
        style={{
          background,
          color,
          fontSize,
          padding: '0.18em 0.32em',
          letterSpacing: '-0.01em',
          whiteSpace: 'pre',
          minHeight: '1em',
          display: 'inline-block',
        }}
      >
        {visible || ' '}
      </span>
    </AbsoluteFill>
  );
}

export default defineVideoComponent({
  name: 'Highlight',
  description:
    'YC-style bottom-center highlight bar that types in and types out over an orange block.',
  schema: highlightSchema,
  component: Highlight,
});
