import { Easing } from 'remotion';

export type EasingName = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
export type CubicBezier = readonly [number, number, number, number];
export type EasingSpec = EasingName | CubicBezier;

export function resolveEasing(spec: EasingSpec): (t: number) => number {
  if (typeof spec === 'string') {
    switch (spec) {
      case 'linear':
        return Easing.linear;
      case 'easeIn':
        return Easing.in(Easing.cubic);
      case 'easeOut':
        return Easing.out(Easing.cubic);
      case 'easeInOut':
        return Easing.inOut(Easing.cubic);
      default: {
        const _exhaustive: never = spec;
        throw new Error(`Unknown easing: ${String(_exhaustive)}`);
      }
    }
  }
  const [x1, y1, x2, y2] = spec;
  return Easing.bezier(x1, y1, x2, y2);
}
