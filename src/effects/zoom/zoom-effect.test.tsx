import { describe, expect, it } from 'vitest';
import {
  getZoomState,
  resolveZoomKeyframes,
  type ResolvedZoomKeyframe,
  type ZoomKeyframe,
} from '@/effects/zoom/zoom-effect';

const kf = (
  at: number,
  scale: number,
  duration: number,
  easing: ResolvedZoomKeyframe['transition']['easing'] = 'linear',
  origin: [number, number] = [0.5, 0.5],
): ResolvedZoomKeyframe => ({
  at,
  scale,
  origin,
  transition: { duration, easing },
});

describe('getZoomState', () => {
  it('returns first keyframe state before its `at` time', () => {
    const keyframes = [kf(1, 1.5, 0.5), kf(3, 2, 0.5)];
    const s = getZoomState(0, keyframes);
    expect(s.scale).toBe(1.5);
    expect(s.origin).toEqual([0.5, 0.5]);
  });

  it('returns first keyframe state exactly at its `at` time', () => {
    const keyframes = [kf(1, 1.5, 0.5), kf(3, 2, 0.5)];
    const s = getZoomState(1, keyframes);
    expect(s.scale).toBe(1.5);
  });

  it('linearly interpolates scale mid-transition', () => {
    // KF0 sets scale=1 at t=0 (instant). KF1 transitions to 2 over [1, 2].
    const keyframes = [kf(0, 1, 0), kf(1, 2, 1, 'linear')];
    const s = getZoomState(1.5, keyframes);
    expect(s.scale).toBeCloseTo(1.5, 6);
  });

  it('interpolates origin per-axis independently', () => {
    const keyframes = [
      kf(0, 1, 0, 'linear', [0, 0]),
      kf(1, 1, 1, 'linear', [1, 0.5]),
    ];
    const s = getZoomState(1.5, keyframes);
    expect(s.origin[0]).toBeCloseTo(0.5, 6);
    expect(s.origin[1]).toBeCloseTo(0.25, 6);
  });

  it('holds previous keyframe target during a hold window', () => {
    const keyframes = [
      kf(0, 1, 0),
      kf(1, 2, 0.5, 'linear'),
      kf(3, 1, 0.5, 'linear'),
    ];
    const s = getZoomState(2, keyframes);
    expect(s.scale).toBe(2);
  });

  it('clamps to last keyframe target after its transition ends', () => {
    const keyframes = [kf(0, 1, 0), kf(1, 2, 0.5, 'linear')];
    const s = getZoomState(10, keyframes);
    expect(s.scale).toBe(2);
  });

  it('treats duration 0 as an instantaneous step at `at`', () => {
    const keyframes = [kf(0, 1, 0), kf(1, 2.5, 0)];
    expect(getZoomState(0.999, keyframes).scale).toBe(1);
    expect(getZoomState(1, keyframes).scale).toBe(2.5);
    expect(getZoomState(1.5, keyframes).scale).toBe(2.5);
  });

  it('handles a single keyframe as a static state', () => {
    const keyframes = [kf(0, 1.7, 0)];
    expect(getZoomState(-1, keyframes).scale).toBe(1.7);
    expect(getZoomState(0, keyframes).scale).toBe(1.7);
    expect(getZoomState(99, keyframes).scale).toBe(1.7);
  });

  it('resolveZoomKeyframes fills missing fields with defaults', () => {
    const input: ZoomKeyframe[] = [{ at: 0 }, { at: 1, scale: 2 }];
    const resolved = resolveZoomKeyframes(input);
    expect(resolved[0]).toEqual({
      at: 0,
      scale: 1,
      origin: [0.5, 0.5],
      transition: { duration: 0, easing: 'easeInOut' },
    });
    expect(resolved[1]!.scale).toBe(2);
    expect(resolved[1]!.transition.easing).toBe('easeInOut');
  });

  it('applies non-linear easing within a transition', () => {
    // Transition window is [1, 2]; sample at 1.5 (raw t=0.5).
    const keyframes = [kf(0, 1, 0), kf(1, 2, 1, 'easeIn')];
    const linearMid = 1.5;
    const easedMid = getZoomState(1.5, keyframes).scale;
    expect(easedMid).toBeLessThan(linearMid);
    expect(easedMid).toBeGreaterThan(1);
  });
});
