import { z } from 'zod';
import { AbsoluteFill, interpolate, spring } from 'remotion';
import { useTimelineItem } from 'video-as-code-for-agents';
import type { TimelineProps } from 'video-as-code-for-agents';
import { defineVideoComponent } from 'video-as-code-for-agents';

export const numberedListPanelSchema = z.object({
  title: z.string(),
  items: z.array(z.string()).min(1),
  background: z.string().default('#161616'),
  accentColor: z.string().default('#F26625'),
  textColor: z.string().default('#ffffff'),
  widthFraction: z.number().min(0).max(1).default(0.5),
  titleFontSize: z.number().default(40),
  itemFontSize: z.number().default(46),
  itemGap: z.number().default(18),
  paddingX: z.number().default(64),
  paddingY: z.number().default(72),
  staggerSeconds: z.number().default(0.18),
});

type NumberedListPanelProps = z.input<typeof numberedListPanelSchema> &
  TimelineProps;

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export function NumberedListPanel(props: NumberedListPanelProps) {
  const { localFrame, fps, localSeconds, duration } = useTimelineItem();

  const background = props.background ?? '#161616';
  const accentColor = props.accentColor ?? '#F26625';
  const textColor = props.textColor ?? '#ffffff';
  const widthFraction = props.widthFraction ?? 0.5;
  const titleFontSize = props.titleFontSize ?? 40;
  const itemFontSize = props.itemFontSize ?? 46;
  const itemGap = props.itemGap ?? 18;
  const paddingX = props.paddingX ?? 64;
  const paddingY = props.paddingY ?? 72;
  const stagger = props.staggerSeconds ?? 0.18;

  const panelProgress = spring({
    frame: localFrame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 22, stiffness: 90 },
  });

  const exitProgress = interpolate(
    localSeconds,
    [Math.max(0, duration - 0.5), duration],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const panelTranslate = (1 - panelProgress) * -40 + exitProgress * -40;
  const panelOpacity = panelProgress * (1 - exitProgress);

  const titleOpacity = interpolate(
    localSeconds,
    [0.15, 0.55, Math.max(0, duration - 0.45), Math.max(0, duration - 0.1)],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: `${widthFraction * 100}%`,
          background,
          transform: `translateX(${panelTranslate}px)`,
          opacity: panelOpacity,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingLeft: paddingX,
          paddingRight: paddingX,
          paddingTop: paddingY,
          paddingBottom: paddingY,
          fontFamily: FONT_FAMILY,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            color: textColor,
            fontSize: titleFontSize,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            opacity: titleOpacity,
            marginBottom: itemGap * 1.6,
          }}
        >
          {props.title}
        </div>

        <ol
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: itemGap,
          }}
        >
          {props.items.map((item, index) => {
            const itemStart = 0.35 + index * stagger;
            const itemOpacity = interpolate(
              localSeconds,
              [itemStart, itemStart + 0.35],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            );
            const itemTranslate = interpolate(
              localSeconds,
              [itemStart, itemStart + 0.35],
              [16, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            );
            const itemExit = interpolate(
              localSeconds,
              [Math.max(0, duration - 0.4), duration],
              [1, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            );

            const numberLabel = String(index + 1).padStart(2, '0');

            return (
              <li
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 20,
                  opacity: itemOpacity * itemExit,
                  transform: `translateY(${itemTranslate}px)`,
                }}
              >
                <span
                  style={{
                    color: accentColor,
                    fontWeight: 700,
                    fontSize: itemFontSize * 0.78,
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: itemFontSize * 1.5,
                    flexShrink: 0,
                  }}
                >
                  {numberLabel}
                </span>
                <span
                  style={{
                    color: textColor,
                    fontWeight: 500,
                    fontSize: itemFontSize,
                    lineHeight: 1.15,
                    letterSpacing: '-0.005em',
                  }}
                >
                  {item}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </AbsoluteFill>
  );
}

export default defineVideoComponent({
  name: 'NumberedListPanel',
  description:
    'Half-screen dark side panel with a bold title and an orange-numbered enumerated list. Items stagger in.',
  schema: numberedListPanelSchema,
  component: NumberedListPanel,
});
