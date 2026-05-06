'use client';

import { usePreviewContext } from './preview-context';

export type UsePreviewReturn = {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  fps: number;
  width: number;
  height: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  seekFrame: (frame: number) => void;
};

export function usePreview(): UsePreviewReturn {
  const ctx = usePreviewContext();
  const { playerRef, fps, durationFrames } = ctx;

  return {
    isPlaying: ctx.isPlaying,
    currentTime: ctx.currentFrame / fps,
    duration: durationFrames / fps,
    fps,
    width: ctx.width,
    height: ctx.height,
    play: () => playerRef.current?.play(),
    pause: () => playerRef.current?.pause(),
    toggle: () => playerRef.current?.toggle(),
    seek: (seconds: number) => playerRef.current?.seekTo(Math.round(seconds * fps)),
    seekFrame: (frame: number) => playerRef.current?.seekTo(frame),
  };
}
