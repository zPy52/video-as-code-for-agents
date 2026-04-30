import { createContext, useContext, type PropsWithChildren } from 'react';
import { useCurrentFrame, useVideoConfig as useRemotionVideoConfig } from 'remotion';
import type { TimelineProps } from '@/reel/component';

type TimelineItem = TimelineProps & { fps: number };

const TimelineItemContext = createContext<TimelineItem | null>(null);

export function TimelineItemProvider(props: PropsWithChildren<TimelineItem>) {
  const { children, ...value } = props;
  return (
    <TimelineItemContext.Provider value={value}>{children}</TimelineItemContext.Provider>
  );
}

export function useVideoConfig() {
  const c = useRemotionVideoConfig();
  return {
    width: c.width,
    height: c.height,
    fps: c.fps,
    duration: c.durationInFrames / c.fps,
  };
}

export function useTimelineItem() {
  const item = useContext(TimelineItemContext);
  if (!item) {
    throw new Error('useTimelineItem() must be called inside <Video>.');
  }
  const frame = useCurrentFrame();
  return {
    start: item.start,
    duration: item.duration,
    zIndex: item.zIndex,
    fps: item.fps,
    localFrame: frame,
    localSeconds: frame / item.fps,
  };
}
