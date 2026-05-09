import { z } from 'zod';
import { AbsoluteFill, interpolate, spring } from 'remotion';
import type { TimelineProps } from 'video-as-code-for-agents';
import { defineVideoComponent } from 'video-as-code-for-agents';
import { useTimelineItem } from 'video-as-code-for-agents';

export const presenterCardSchema = z.object({
  name: z.string(),
  title: z.string().optional(),
  accentColor: z.string().default('#e8621a'),
});

type PresenterCardProps = z.input<typeof presenterCardSchema> & TimelineProps;

const FULL_WIDTH = 730;
const MIN_WIDTH = 12;
const CARD_HEIGHT = 220;
const TOP_BAR_H = 22;
const SQ = TOP_BAR_H;

export function PresenterCard(props: PresenterCardProps) {
  const { localFrame, fps, localSeconds, duration } = useTimelineItem();
  const accent = props.accentColor ?? '#e8621a';

  const entryProgress = spring({
    frame: localFrame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 24, stiffness: 110 },
  });

  const exitCollapse = interpolate(
    localSeconds,
    [duration - 0.5, duration],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const clipFraction = entryProgress * (1 - exitCollapse);
  const cardWidth = MIN_WIDTH + (FULL_WIDTH - MIN_WIDTH) * clipFraction;

  const textOpacity = interpolate(
    localSeconds,
    [0.25, 0.55, duration - 0.45, duration - 0.1],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill style={{ alignItems: 'flex-start', justifyContent: 'flex-end', paddingBottom: 72, paddingLeft: 48 }}>
      <div style={{ width: cardWidth, overflow: 'hidden', position: 'relative', height: CARD_HEIGHT }}>
        <div style={{ width: FULL_WIDTH, position: 'absolute', top: 0, left: 0 }}>
          <div
            style={{
              height: TOP_BAR_H,
              background: `linear-gradient(90deg, #ffffff 0%, ${accent} 100%)`,
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: SQ,
              height: SQ,
              background: '#111',
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: SQ,
              left: 0,
              width: SQ,
              height: SQ,
              background: accent,
            }}
          />

          <div
            style={{
              background: '#ffffff',
              paddingLeft: 56,
              paddingRight: 36,
              paddingTop: 28,
              paddingBottom: 28,
              opacity: textOpacity,
            }}
          >
            <div
              style={{
                fontSize: 62,
                fontWeight: 800,
                color: '#0d0d0d',
                lineHeight: 1.1,
                letterSpacing: '-1.5px',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              }}
            >
              {props.name}
            </div>
            {props.title ? (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 30,
                  fontWeight: 500,
                  color: '#444',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                }}
              >
                {props.title}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export default defineVideoComponent({
  name: 'PresenterCard',
  description: 'Wipe-in lower-third with orange accent bar, white card, bold name, and gray title.',
  schema: presenterCardSchema,
  component: PresenterCard,
});
