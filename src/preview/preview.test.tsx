import { describe, expect, it } from 'vitest';
import React from 'react';
import { Video } from '@/components/video/core-video';
import { extractVideoConfig, formatTime } from '@/preview/preview';

function timed(props: { start: number; duration: number; zIndex: number; key?: string }) {
  const { key, ...rest } = props;
  return <div key={key} {...rest} />;
}

describe('extractVideoConfig', () => {
  it('returns width, height, fps and frame-resolved duration from the inner <Video>', () => {
    const cfg = extractVideoConfig(
      <Video width={1080} height={720} fps={24}>
        {timed({ start: 0, duration: 3, zIndex: 0, key: 'a' })}
        {timed({ start: 3, duration: 2, zIndex: 0, key: 'b' })}
      </Video>,
    );
    expect(cfg.width).toBe(1080);
    expect(cfg.height).toBe(720);
    expect(cfg.fps).toBe(24);
    expect(cfg.durationSeconds).toBe(5);
    expect(cfg.durationFrames).toBe(120);
  });

  it('honours an explicit duration on <Video>', () => {
    const cfg = extractVideoConfig(
      <Video width={100} height={100} fps={30} duration={10}>
        {timed({ start: 0, duration: 1, zIndex: 0, key: 'a' })}
      </Video>,
    );
    expect(cfg.durationSeconds).toBe(10);
    expect(cfg.durationFrames).toBe(300);
  });

  it('rejects non-positive width', () => {
    expect(() =>
      extractVideoConfig(
        <Video width={0} height={100} fps={24}>
          {timed({ start: 0, duration: 1, zIndex: 0, key: 'a' })}
        </Video>,
      ),
    ).toThrow(/width/);
  });

  it('rejects non-integer height', () => {
    expect(() =>
      extractVideoConfig(
        <Video width={100} height={100.5} fps={24}>
          {timed({ start: 0, duration: 1, zIndex: 0, key: 'a' })}
        </Video>,
      ),
    ).toThrow(/height/);
  });

  it('rejects non-positive fps', () => {
    expect(() =>
      extractVideoConfig(
        <Video width={100} height={100} fps={0}>
          {timed({ start: 0, duration: 1, zIndex: 0, key: 'a' })}
        </Video>,
      ),
    ).toThrow(/fps/);
  });
});

describe('formatTime', () => {
  it('formats whole seconds as M:SS', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(59)).toBe('0:59');
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(125)).toBe('2:05');
  });

  it('floors fractional seconds', () => {
    expect(formatTime(5.9)).toBe('0:05');
    expect(formatTime(0.4)).toBe('0:00');
  });

  it('clamps negatives to zero', () => {
    expect(formatTime(-3)).toBe('0:00');
  });

  // unused import guard: ensure React is treated as used (JSX runtime depends on it transitively for older configs)
  it('react is importable', () => {
    expect(typeof React.createElement).toBe('function');
  });
});
