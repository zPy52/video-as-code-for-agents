import { z } from 'zod';
import { AbsoluteFill, interpolate } from 'remotion';
import { useTimelineItem } from 'video-as-code-for-agents';
import type { TimelineProps } from 'video-as-code-for-agents';
import { defineVideoComponent } from 'video-as-code-for-agents';

export const highlightSchema = z.object({
  text: z.string(),
  background: z.string().default('#F26625'),
  color: z.string().default('#ffffff'),
  fontSize: z.number().default(72),
  maxWidth: z.number().default(880),
  typeInSeconds: z.number().default(0.6),
  typeOutSeconds: z.number().default(0.5),
});

type HighlightProps = z.input<typeof highlightSchema> & TimelineProps;

export function Highlight(props: HighlightProps) {
  const { localSeconds, duration } = useTimelineItem();
  const background = props.background ?? '#F26625';
  const color = props.color ?? '#ffffff';
  const fontSize = props.fontSize ?? 72;
  const maxWidth = props.maxWidth ?? 880;
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
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 80,
      }}
    >
      <span
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontWeight: 800,
          background,
          color,
          fontSize,
          lineHeight: 1.15,
          padding: '0.12em 0.28em',
          letterSpacing: '-0.01em',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          textAlign: 'center',
          maxWidth,
          minHeight: '1em',
          display: 'inline-block',
          boxDecorationBreak: 'clone',
          WebkitBoxDecorationBreak: 'clone',
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
