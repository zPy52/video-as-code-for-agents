import type { CSSProperties, PropsWithChildren } from 'react';
import { z } from 'zod';
import { resolveEasing, type EasingSpec } from '../easing';
import { useTimelineItem } from '../../time/time';

const easingSchema: z.ZodType<EasingSpec> = z.union([
  z.enum(['linear', 'easeIn', 'easeOut', 'easeInOut']),
  z.tuple([z.number(), z.number(), z.number(), z.number()]),
]);

export const zoomKeyframeSchema = z.object({
  at: z.number().nonnegative(),
  scale: z.number().positive().default(1),
  origin: z
    .tuple([z.number(), z.number()])
    .default([0.5, 0.5]),
  transition: z
    .object({
      duration: z.number().nonnegative().default(0),
      easing: easingSchema.default('easeInOut'),
    })
    .default({ duration: 0, easing: 'easeInOut' }),
});

export const motionBlurSchema = z
  .union([
    z.boolean(),
    z.object({
      strength: z.number().nonnegative().default(1),
      max: z.number().nonnegative().default(20),
    }),
  ])
  .default(false);

export const zoomEffectSchema = z.object({
  keyframes: z
    .array(zoomKeyframeSchema)
    .min(1)
    .refine(
      (kfs) => kfs.every((k, i) => i === 0 || k.at > kfs[i - 1]!.at),
      { message: 'zoom keyframes must be sorted by `at` in strictly increasing order' },
    ),
  motionBlur: motionBlurSchema,
});

export type ZoomKeyframe = z.input<typeof zoomKeyframeSchema>;
export type MotionBlurConfig = z.input<typeof motionBlurSchema>;
export type ZoomEffectConfig = z.input<typeof zoomEffectSchema>;

export type ResolvedZoomKeyframe = {
  at: number;
  scale: number;
  origin: [number, number];
  transition: {
    duration: number;
    easing: EasingSpec;
  };
};

export type ZoomState = {
  scale: number;
  origin: [number, number];
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function getZoomState(
  seconds: number,
  keyframes: readonly ResolvedZoomKeyframe[],
): ZoomState {
  if (keyframes.length === 0) {
    return { scale: 1, origin: [0.5, 0.5] };
  }

  const first = keyframes[0]!;
  if (seconds <= first.at) {
    return { scale: first.scale, origin: [...first.origin] };
  }

  for (let i = 1; i < keyframes.length; i++) {
    const prev = keyframes[i - 1]!;
    const curr = keyframes[i]!;
    const tStart = curr.at;
    const tEnd = curr.at + curr.transition.duration;

    if (seconds < tStart) {
      return { scale: prev.scale, origin: [...prev.origin] };
    }
    if (seconds <= tEnd) {
      const raw =
        curr.transition.duration === 0
          ? 1
          : (seconds - tStart) / curr.transition.duration;
      const eased = resolveEasing(curr.transition.easing)(raw);
      return {
        scale: lerp(prev.scale, curr.scale, eased),
        origin: [
          lerp(prev.origin[0], curr.origin[0], eased),
          lerp(prev.origin[1], curr.origin[1], eased),
        ],
      };
    }
  }

  const last = keyframes[keyframes.length - 1]!;
  return { scale: last.scale, origin: [...last.origin] };
}

export function resolveZoomKeyframes(
  keyframes: readonly ZoomKeyframe[],
): ResolvedZoomKeyframe[] {
  return keyframes.map((k) => ({
    at: k.at,
    scale: k.scale ?? 1,
    origin: k.origin ?? [0.5, 0.5],
    transition: {
      duration: k.transition?.duration ?? 0,
      easing: (k.transition?.easing ?? 'easeInOut') as EasingSpec,
    },
  }));
}

export function resolveZoomMotionBlur(
  mb: MotionBlurConfig | undefined,
): boolean | { strength: number; max: number } {
  if (mb === undefined || mb === false) return false;
  if (mb === true) return true;
  return { strength: mb.strength ?? 1, max: mb.max ?? 20 };
}

const BLUR_PX_PER_SCALE_PER_SEC = 4;

type ResolvedMotionBlur = { strength: number; max: number };

function resolveMotionBlur(
  mb: boolean | ResolvedMotionBlur,
): ResolvedMotionBlur | null {
  if (mb === false) return null;
  if (mb === true) return { strength: 1, max: 20 };
  return mb;
}

export function getZoomStyle(input: {
  localSeconds: number;
  fps: number;
  keyframes: readonly ResolvedZoomKeyframe[];
  motionBlur: boolean | ResolvedMotionBlur;
}): CSSProperties {
  const { localSeconds, fps, keyframes, motionBlur } = input;
  const curr = getZoomState(localSeconds, keyframes);

  const style: CSSProperties = {
    transform: `scale(${curr.scale})`,
    transformOrigin: `${curr.origin[0] * 100}% ${curr.origin[1] * 100}%`,
  };

  const mb = resolveMotionBlur(motionBlur);
  if (mb) {
    const dt = 1 / fps;
    const prev = getZoomState(Math.max(0, localSeconds - dt), keyframes);
    const dScalePerSec = Math.abs(curr.scale - prev.scale) * fps;
    const blurPx = Math.min(
      mb.max,
      mb.strength * dScalePerSec * BLUR_PX_PER_SCALE_PER_SEC,
    );
    if (blurPx > 0) {
      style.filter = `blur(${blurPx}px)`;
    }
  }

  return style;
}

export type ZoomEffectProps = PropsWithChildren<{
  keyframes: readonly ZoomKeyframe[];
  motionBlur?: MotionBlurConfig;
}>;

export function ZoomEffect({
  keyframes,
  motionBlur,
  children,
}: ZoomEffectProps) {
  const { localSeconds, fps } = useTimelineItem();
  const resolvedKeyframes = resolveZoomKeyframes(keyframes);
  const resolvedBlur = resolveZoomMotionBlur(motionBlur);
  const style = getZoomStyle({
    localSeconds,
    fps,
    keyframes: resolvedKeyframes,
    motionBlur: resolvedBlur,
  });
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        willChange: 'transform, filter',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
