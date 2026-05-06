import { createContext, useContext, type RefObject } from 'react';
import type { PlayerRef } from '@remotion/player';

export type PreviewContextValue = {
  playerRef: RefObject<PlayerRef | null>;
  isPlaying: boolean;
  currentFrame: number;
  durationFrames: number;
  fps: number;
  width: number;
  height: number;
};

export const PreviewContext = createContext<PreviewContextValue | null>(null);

export function usePreviewContext(): PreviewContextValue {
  const ctx = useContext(PreviewContext);
  if (!ctx) {
    throw new Error('usePreview() must be called inside <Preview>.');
  }
  return ctx;
}
