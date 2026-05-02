import { describe, expect, it } from 'vitest';
import { zoomEffectSchema, zoomKeyframeSchema } from '@/effects/zoom/zoom-effect';

describe('zoomKeyframeSchema', () => {
  it('applies defaults: scale=1, origin=[0.5,0.5], transition={duration:0,easing:easeInOut}', () => {
    const k = zoomKeyframeSchema.parse({ at: 0 });
    expect(k.scale).toBe(1);
    expect(k.origin).toEqual([0.5, 0.5]);
    expect(k.transition.duration).toBe(0);
    expect(k.transition.easing).toBe('easeInOut');
  });

  it('rejects negative `at`', () => {
    expect(() => zoomKeyframeSchema.parse({ at: -1 })).toThrow();
  });

  it('rejects non-positive scale', () => {
    expect(() => zoomKeyframeSchema.parse({ at: 0, scale: 0 })).toThrow();
    expect(() => zoomKeyframeSchema.parse({ at: 0, scale: -0.5 })).toThrow();
  });

  it('rejects negative transition duration', () => {
    expect(() =>
      zoomKeyframeSchema.parse({ at: 0, transition: { duration: -0.1 } }),
    ).toThrow();
  });

  it('accepts cubic-bezier easing tuple', () => {
    const k = zoomKeyframeSchema.parse({
      at: 0,
      transition: { duration: 0.5, easing: [0.4, 0, 0.6, 1] },
    });
    expect(k.transition.easing).toEqual([0.4, 0, 0.6, 1]);
  });
});

describe('zoomEffectSchema', () => {
  it('requires at least one keyframe', () => {
    expect(() => zoomEffectSchema.parse({ keyframes: [] })).toThrow();
  });

  it('rejects keyframes whose `at` is not strictly increasing', () => {
    expect(() =>
      zoomEffectSchema.parse({
        keyframes: [{ at: 1 }, { at: 0.5 }],
      }),
    ).toThrow(/sorted|order|increasing/i);
  });

  it('defaults motionBlur to false', () => {
    const cfg = zoomEffectSchema.parse({ keyframes: [{ at: 0 }] });
    expect(cfg.motionBlur).toBe(false);
  });

  it('accepts motionBlur=true', () => {
    const cfg = zoomEffectSchema.parse({
      keyframes: [{ at: 0 }],
      motionBlur: true,
    });
    expect(cfg.motionBlur).toBe(true);
  });

  it('accepts motionBlur object with strength and max', () => {
    const cfg = zoomEffectSchema.parse({
      keyframes: [{ at: 0 }],
      motionBlur: { strength: 2, max: 30 },
    });
    expect(cfg.motionBlur).toEqual({ strength: 2, max: 30 });
  });
});
