import { describe, expect, it } from 'vitest';
import { getZoomStyle, type ResolvedZoomKeyframe } from '@/effects/zoom/zoom-effect';

const kf = (
  at: number,
  scale: number,
  duration: number,
): ResolvedZoomKeyframe => ({
  at,
  scale,
  origin: [0.5, 0.5],
  transition: { duration, easing: 'linear' },
});

describe('getZoomStyle', () => {
  it('emits transform with the current scale and origin in percent', () => {
    const keyframes: ResolvedZoomKeyframe[] = [
      { at: 0, scale: 1.5, origin: [0.25, 0.75], transition: { duration: 0, easing: 'linear' } },
    ];
    const style = getZoomStyle({
      localSeconds: 0,
      fps: 30,
      keyframes,
      motionBlur: false,
    });
    expect(style.transform).toBe('scale(1.5)');
    expect(style.transformOrigin).toBe('25% 75%');
  });

  it('omits filter when motionBlur is false', () => {
    const keyframes = [kf(0, 1, 0), kf(1, 2, 0.5)];
    const style = getZoomStyle({
      localSeconds: 1.25,
      fps: 30,
      keyframes,
      motionBlur: false,
    });
    expect(style.filter).toBeUndefined();
  });

  it('omits filter during a hold (no scale change between frames)', () => {
    const keyframes = [kf(0, 1, 0), kf(1, 2, 0.5)];
    const style = getZoomStyle({
      localSeconds: 2,
      fps: 30,
      keyframes,
      motionBlur: true,
    });
    expect(style.filter).toBeUndefined();
  });

  it('applies blur filter when scale is changing and motionBlur is enabled', () => {
    const keyframes = [kf(0, 1, 0), kf(1, 2, 0.5)];
    const style = getZoomStyle({
      localSeconds: 1.25,
      fps: 30,
      keyframes,
      motionBlur: true,
    });
    expect(style.filter).toMatch(/^blur\(\d+(\.\d+)?px\)$/);
  });

  it('clamps blur to the configured `max`', () => {
    const keyframes = [kf(0, 1, 0), kf(0.001, 100, 0.001)];
    const style = getZoomStyle({
      localSeconds: 0.0015,
      fps: 30,
      keyframes,
      motionBlur: { strength: 1, max: 5 },
    });
    const match = style.filter!.match(/blur\(([\d.]+)px\)/)!;
    expect(parseFloat(match[1]!)).toBeLessThanOrEqual(5);
  });

  it('scales blur with `strength` multiplier', () => {
    const keyframes = [kf(0, 1, 0), kf(1, 2, 0.5)];
    const weak = getZoomStyle({
      localSeconds: 1.25,
      fps: 30,
      keyframes,
      motionBlur: { strength: 0.5, max: 100 },
    });
    const strong = getZoomStyle({
      localSeconds: 1.25,
      fps: 30,
      keyframes,
      motionBlur: { strength: 2, max: 100 },
    });
    const w = parseFloat(weak.filter!.match(/blur\(([\d.]+)px\)/)![1]!);
    const s = parseFloat(strong.filter!.match(/blur\(([\d.]+)px\)/)![1]!);
    expect(s).toBeGreaterThan(w);
  });
});
