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
const CARD_HEIGHT = 180;
const TOP_BAR_H = 18;
const ACCENT_SQ = 26;

export function PresenterCard(props: PresenterCardProps) {
  const { localFrame, fps, localSeconds, duration } = useTimelineItem();
  const accent = props.accentColor ?? '#e8621a';

  // Entry: spring-driven wipe from narrow bar → full card width
  const entryProgress = spring({
    frame: localFrame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 24, stiffness: 110 },
  });

  // Exit: collapse back to narrow bar in the last 0.5 s
  const exitCollapse = interpolate(
    localSeconds,
    [duration - 0.5, duration],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const clipFraction = entryProgress * (1 - exitCollapse);
  const cardWidth = MIN_WIDTH + (FULL_WIDTH - MIN_WIDTH) * clipFraction;

  // Text fades in once the card is ~50 % revealed and fades out early
  const textOpacity = interpolate(
    localSeconds,
    [0.25, 0.55, duration - 0.45, duration - 0.1],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill style={{ alignItems: 'flex-end', justifyContent: 'flex-start', paddingBottom: 72, paddingLeft: 48 }}>
      {/* Clipping wrapper — drives the wipe animation */}
      <div style={{ width: cardWidth, overflow: 'hidden', position: 'relative', height: CARD_HEIGHT }}>
        {/* Inner card at full width so content is clipped, not squished */}
        <div style={{ width: FULL_WIDTH, position: 'absolute', top: 0, left: 0 }}>

          {/* Orange top accent bar with gradient */}
          <div
            style={{
              height: TOP_BAR_H,
              background: `linear-gradient(90deg, ${accent} 0%, #f0a060 100%)`,
            }}
          />

          {/* Black micro-square + orange square stacked at top-left corner */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: ACCENT_SQ + 4,
              height: ACCENT_SQ + 4,
              background: '#111',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: ACCENT_SQ,
              height: ACCENT_SQ,
              background: accent,
            }}
          />

          {/* White card body */}
          <div
            style={{
              background: '#ffffff',
              paddingLeft: 36,
              paddingRight: 36,
              paddingTop: 20,
              paddingBottom: 24,
              opacity: textOpacity,
            }}
          >
            <div
              style={{
                fontSize: 62,
                fontWeight: 700,
                color: '#0d0d0d',
                lineHeight: 1.1,
                letterSpacing: '-1px',
                fontFamily: 'sans-serif',
              }}
            >
              {props.name}
            </div>
            {props.title ? (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 30,
                  fontWeight: 400,
                  color: '#444',
                  fontFamily: 'sans-serif',
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
