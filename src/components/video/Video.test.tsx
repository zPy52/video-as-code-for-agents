import { describe, expect, it } from 'vitest';
import React from 'react';
import {
  collectScheduledChildren,
  getVideoDuration,
  secondsToFrames,
} from '@/components/video/core-video';

function child(props: { start: number; duration: number; zIndex: number; key?: string }) {
  return React.createElement('div', props);
}

describe('secondsToFrames', () => {
  it('converts whole seconds to integer frames', () => {
    expect(secondsToFrames(2, 30)).toBe(60);
  });

  it('rounds fractional frames to the nearest integer', () => {
    expect(secondsToFrames(0.5, 24)).toBe(12);
    expect(secondsToFrames(1 / 3, 24)).toBe(8);
    expect(secondsToFrames(0.04, 24)).toBe(1);
  });

  it('returns 0 for 0 seconds', () => {
    expect(secondsToFrames(0, 30)).toBe(0);
  });
});

describe('collectScheduledChildren', () => {
  it('returns one entry per child preserving order', () => {
    const a = child({ start: 0, duration: 1, zIndex: 0, key: 'a' });
    const b = child({ start: 1, duration: 1, zIndex: 0, key: 'b' });
    const result = collectScheduledChildren([a, b]);
    expect(result).toHaveLength(2);
    expect(result[0]!.props).toEqual({ start: 0, duration: 1, zIndex: 0 });
    expect(result[0]!.index).toBe(0);
    expect(result[1]!.index).toBe(1);
  });

  it('accepts a single child (not an array)', () => {
    const a = child({ start: 0, duration: 1, zIndex: 0 });
    expect(collectScheduledChildren(a)).toHaveLength(1);
  });

  it('throws when a child is not a React element', () => {
    expect(() => collectScheduledChildren(['raw string'])).toThrow(
      /must be React elements/,
    );
  });

  it('rejects negative start', () => {
    const c = child({ start: -1, duration: 1, zIndex: 0 });
    expect(() => collectScheduledChildren([c])).toThrow(/start/);
  });

  it('rejects non-finite start', () => {
    const c = child({ start: Infinity, duration: 1, zIndex: 0 });
    expect(() => collectScheduledChildren([c])).toThrow(/start/);
  });

  it('rejects zero duration', () => {
    const c = child({ start: 0, duration: 0, zIndex: 0 });
    expect(() => collectScheduledChildren([c])).toThrow(/duration/);
  });

  it('rejects negative duration', () => {
    const c = child({ start: 0, duration: -2, zIndex: 0 });
    expect(() => collectScheduledChildren([c])).toThrow(/duration/);
  });

  it('rejects non-integer zIndex', () => {
    const c = child({ start: 0, duration: 1, zIndex: 1.5 });
    expect(() => collectScheduledChildren([c])).toThrow(/zIndex/);
  });

  it('assigns a stable, unique key to every scheduled child', () => {
    const a = child({ start: 0, duration: 1, zIndex: 0, key: 'first' });
    const b = child({ start: 1, duration: 1, zIndex: 0, key: 'second' });
    const c = child({ start: 2, duration: 1, zIndex: 0 });
    const result = collectScheduledChildren([a, b, c]);
    const keys = result.map((r) => r.key);
    expect(new Set(keys).size).toBe(3);
    keys.forEach((k) => expect(k).not.toBeNull());
  });
});

describe('scheduled child sorting (zIndex then source order)', () => {
  function sortScheduled(children: React.ReactNode) {
    return collectScheduledChildren(children).sort(
      (a, b) => a.props.zIndex - b.props.zIndex || a.index - b.index,
    );
  }

  it('orders by ascending zIndex', () => {
    const a = child({ start: 0, duration: 1, zIndex: 5, key: 'a' });
    const b = child({ start: 0, duration: 1, zIndex: 1, key: 'b' });
    const c = child({ start: 0, duration: 1, zIndex: 3, key: 'c' });
    const sorted = sortScheduled([a, b, c]).map((s) => s.props.zIndex);
    expect(sorted).toEqual([1, 3, 5]);
  });

  it('preserves source order on zIndex ties', () => {
    const a = child({ start: 0, duration: 1, zIndex: 0, key: 'a' });
    const b = child({ start: 0, duration: 1, zIndex: 0, key: 'b' });
    const c = child({ start: 0, duration: 1, zIndex: 0, key: 'c' });
    const sorted = sortScheduled([a, b, c]).map((s) => s.index);
    expect(sorted).toEqual([0, 1, 2]);
  });
});

describe('getVideoDuration', () => {
  it('returns the explicit duration when provided', () => {
    const a = child({ start: 0, duration: 1, zIndex: 0 });
    expect(getVideoDuration([a], 10)).toBe(10);
  });

  it('derives duration from the latest child end when omitted', () => {
    const a = child({ start: 0, duration: 1, zIndex: 0 });
    const b = child({ start: 3.5, duration: 2, zIndex: 1 });
    expect(getVideoDuration([a, b])).toBe(5.5);
  });

  it('returns at least 1 when there are no children', () => {
    expect(getVideoDuration([])).toBe(1);
  });
});
