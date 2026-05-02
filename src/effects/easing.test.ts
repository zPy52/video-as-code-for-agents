import { describe, expect, it } from 'vitest';
import { resolveEasing } from '@/effects/easing';

describe('resolveEasing', () => {
  it('linear: identity at endpoints and midpoint', () => {
    const fn = resolveEasing('linear');
    expect(fn(0)).toBeCloseTo(0, 6);
    expect(fn(0.5)).toBeCloseTo(0.5, 6);
    expect(fn(1)).toBeCloseTo(1, 6);
  });

  it('easeIn: starts slow (below linear) before midpoint', () => {
    const fn = resolveEasing('easeIn');
    expect(fn(0)).toBeCloseTo(0, 6);
    expect(fn(1)).toBeCloseTo(1, 6);
    expect(fn(0.25)).toBeLessThan(0.25);
  });

  it('easeOut: starts fast (above linear) before midpoint', () => {
    const fn = resolveEasing('easeOut');
    expect(fn(0)).toBeCloseTo(0, 6);
    expect(fn(1)).toBeCloseTo(1, 6);
    expect(fn(0.25)).toBeGreaterThan(0.25);
  });

  it('easeInOut: symmetric around 0.5', () => {
    const fn = resolveEasing('easeInOut');
    expect(fn(0)).toBeCloseTo(0, 6);
    expect(fn(0.5)).toBeCloseTo(0.5, 4);
    expect(fn(1)).toBeCloseTo(1, 6);
    expect(fn(0.25) + fn(0.75)).toBeCloseTo(1, 4);
  });

  it('cubic-bezier tuple: hits endpoints and is monotonic for sane control points', () => {
    const fn = resolveEasing([0.42, 0, 0.58, 1]);
    expect(fn(0)).toBeCloseTo(0, 4);
    expect(fn(1)).toBeCloseTo(1, 4);
    let prev = -Infinity;
    for (let t = 0; t <= 1; t += 0.05) {
      const v = fn(t);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-6);
      prev = v;
    }
  });
});
