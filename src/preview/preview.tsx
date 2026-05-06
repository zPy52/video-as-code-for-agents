'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { getVideoDuration, secondsToFrames, type VideoProps } from '../components/video/core-video';
import { PreviewContext, type PreviewContextValue } from './preview-context';
import { usePreview } from './use-preview';

export type PreviewClassNames = {
  container?: string;
  player?: string;
  controls?: string;
  playButton?: string;
  slider?: string;
  timeLabel?: string;
};

export type PreviewStyles = {
  container?: React.CSSProperties;
  player?: React.CSSProperties;
  controls?: React.CSSProperties;
  playButton?: React.CSSProperties;
  slider?: React.CSSProperties;
  timeLabel?: React.CSSProperties;
};

export type PreviewSlots = {
  playButton?: React.ReactNode;
  slider?: React.ReactNode;
  timeLabel?: React.ReactNode;
  controls?: React.ReactNode;
};

export type PreviewProps = {
  children: React.ReactElement<VideoProps>;
  classNames?: PreviewClassNames;
  styles?: PreviewStyles;
  slots?: PreviewSlots;
  autoPlay?: boolean;
  loop?: boolean;
  showControls?: boolean;
};

export type ResolvedVideoConfig = {
  width: number;
  height: number;
  fps: number;
  durationSeconds: number;
  durationFrames: number;
};

export function extractVideoConfig(
  element: React.ReactElement<VideoProps>,
): ResolvedVideoConfig {
  if (!React.isValidElement(element)) {
    throw new Error('<Preview> requires a single <Video> element as a child.');
  }
  const { width, height, fps, duration, children } = element.props as VideoProps;

  if (!Number.isInteger(width) || width <= 0) {
    throw new Error(`<Preview>: <Video> width must be a positive integer (got ${width}).`);
  }
  if (!Number.isInteger(height) || height <= 0) {
    throw new Error(`<Preview>: <Video> height must be a positive integer (got ${height}).`);
  }
  if (!Number.isFinite(fps) || fps <= 0) {
    throw new Error(`<Preview>: <Video> fps must be a positive number (got ${fps}).`);
  }

  const durationSeconds = getVideoDuration(children, duration);
  const durationFrames = Math.max(1, secondsToFrames(durationSeconds, fps));

  return { width, height, fps, durationSeconds, durationFrames };
}

export function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60).toString();
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const StylesContext = createContext<{
  classNames: PreviewClassNames;
  styles: PreviewStyles;
  slots: PreviewSlots;
} | null>(null);

function useStyles() {
  const ctx = useContext(StylesContext);
  if (!ctx) throw new Error('Preview default UI used outside <Preview>.');
  return ctx;
}

type ContentProps = { content: React.ReactElement };

function PreviewVideoComponent({ content }: ContentProps) {
  return content;
}

export function Preview(props: PreviewProps) {
  const {
    children,
    classNames = {},
    styles = {},
    slots = {},
    autoPlay,
    loop,
    showControls = true,
  } = props;

  const config = extractVideoConfig(children);

  const playerRef = useRef<PlayerRef | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onFrameUpdate = (e: { detail: { frame: number } }) => {
      setCurrentFrame(e.detail.frame);
    };

    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);
    player.addEventListener('ended', onEnded);
    player.addEventListener('frameupdate', onFrameUpdate);

    return () => {
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);
      player.removeEventListener('ended', onEnded);
      player.removeEventListener('frameupdate', onFrameUpdate);
    };
  }, []);

  const ctx: PreviewContextValue = {
    playerRef,
    isPlaying,
    currentFrame,
    durationFrames: config.durationFrames,
    fps: config.fps,
    width: config.width,
    height: config.height,
  };

  return (
    <PreviewContext.Provider value={ctx}>
      <StylesContext.Provider value={{ classNames, styles, slots }}>
        <div
          className={classNames.container}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            width: '100%',
            ...styles.container,
          }}
        >
          <Player
            ref={playerRef}
            component={PreviewVideoComponent}
            inputProps={{ content: children }}
            durationInFrames={config.durationFrames}
            fps={config.fps}
            compositionWidth={config.width}
            compositionHeight={config.height}
            controls={false}
            autoPlay={autoPlay}
            loop={loop}
            className={classNames.player}
            style={{
              width: '100%',
              aspectRatio: `${config.width} / ${config.height}`,
              ...styles.player,
            }}
          />
          {showControls ? (slots.controls ?? <DefaultControls />) : null}
        </div>
      </StylesContext.Provider>
    </PreviewContext.Provider>
  );
}

function DefaultControls() {
  const { classNames, styles, slots } = useStyles();
  return (
    <div
      className={classNames.controls}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        ...styles.controls,
      }}
    >
      {slots.playButton ?? <DefaultPlayButton />}
      {slots.slider ?? <DefaultSlider />}
      {slots.timeLabel ?? <DefaultTimeLabel />}
    </div>
  );
}

function DefaultPlayButton() {
  const { classNames, styles } = useStyles();
  const { isPlaying, toggle } = usePreview();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isPlaying ? 'Pause' : 'Play'}
      className={classNames.playButton}
      style={{
        width: 32,
        height: 32,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        borderRadius: 4,
        background: '#000',
        color: '#fff',
        cursor: 'pointer',
        ...styles.playButton,
      }}
    >
      {isPlaying ? (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
          <rect x="2" y="1" width="3" height="10" />
          <rect x="7" y="1" width="3" height="10" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
          <path d="M2 1 L11 6 L2 11 Z" />
        </svg>
      )}
    </button>
  );
}

function DefaultSlider() {
  const { classNames, styles } = useStyles();
  const { currentTime, duration, seek } = usePreview();
  return (
    <input
      type="range"
      min={0}
      max={duration}
      step={0.01}
      value={Math.min(currentTime, duration)}
      onChange={(e) => seek(Number(e.target.value))}
      aria-label="Seek"
      className={classNames.slider}
      style={{ flex: 1, ...styles.slider }}
    />
  );
}

function DefaultTimeLabel() {
  const { classNames, styles } = useStyles();
  const { currentTime, duration } = usePreview();
  return (
    <span
      className={classNames.timeLabel}
      style={{
        fontVariantNumeric: 'tabular-nums',
        fontSize: 12,
        color: '#444',
        minWidth: 80,
        textAlign: 'right',
        ...styles.timeLabel,
      }}
    >
      {formatTime(currentTime)} / {formatTime(duration)}
    </span>
  );
}

export { usePreview } from './use-preview';
export type { UsePreviewReturn } from './use-preview';
