import { describe, expect, it } from 'vitest';
import React from 'react';
import { z } from 'zod';
import { Video } from '@/components/video/core-video';
import { defineVideoComponent } from '@/components/video/component';
import { validateVideoElement } from '@/validation/validate';

const Box = defineVideoComponent({
  name: 'Box',
  schema: z.object({ label: z.string() }),
  component: () => null,
});

const Spacer = defineVideoComponent({
  name: 'Spacer',
  schema: z.object({ size: z.number().min(1) }),
  component: () => null,
});

const fakeRegistry = { Box, Spacer };

function videoElement(
  props: Partial<React.ComponentProps<typeof Video>> = {},
  children: React.ReactNode = React.createElement(Box.component, {
    start: 0,
    duration: 1,
    zIndex: 0,
    label: 'hi',
  }),
) {
  return React.createElement(
    Video,
    { width: 1080, height: 720, fps: 24, ...props } as React.ComponentProps<typeof Video>,
    children,
  );
}

describe('validateVideoElement', () => {
  it('accepts a well-formed Video element', () => {
    const result = validateVideoElement(videoElement(), fakeRegistry);
    expect(result.ok).toBe(true);
  });

  it('errors when the root is not <Video>', () => {
    const wrong = React.createElement('div', {});
    const result = validateVideoElement(wrong, fakeRegistry);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(' ')).toMatch(/<Video>/);
    }
  });

  it.each([
    { field: 'width', value: 0 },
    { field: 'width', value: -10 },
    { field: 'width', value: 1.5 },
    { field: 'height', value: 0 },
    { field: 'fps', value: 0 },
    { field: 'fps', value: -24 },
  ])('errors when $field is $value', ({ field, value }) => {
    const result = validateVideoElement(
      videoElement({ [field]: value } as never),
      fakeRegistry,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(' ')).toMatch(new RegExp(field));
    }
  });

  it('errors when explicit duration does not cover the last scheduled child', () => {
    const child = React.createElement(Box.component, {
      start: 0,
      duration: 5,
      zIndex: 0,
      label: 'hi',
    });
    const result = validateVideoElement(
      videoElement({ duration: 2 }, child),
      fakeRegistry,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(' ')).toMatch(/duration/);
    }
  });

  it('accepts an explicit duration that covers all children', () => {
    const child = React.createElement(Box.component, {
      start: 0,
      duration: 2,
      zIndex: 0,
      label: 'hi',
    });
    const result = validateVideoElement(
      videoElement({ duration: 5 }, child),
      fakeRegistry,
    );
    expect(result.ok).toBe(true);
  });

  it('errors when a child component is not registered', () => {
    const Unknown = (_p: unknown) => null;
    const child = React.createElement(Unknown, {
      start: 0,
      duration: 1,
      zIndex: 0,
    } as never);
    const result = validateVideoElement(videoElement({}, child), fakeRegistry);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(' ')).toMatch(/registry/i);
    }
  });

  it('errors when child non-timeline props fail the registered schema', () => {
    const child = React.createElement(Spacer.component, {
      start: 0,
      duration: 1,
      zIndex: 0,
      // size missing — schema requires a number >= 1
    } as never);
    const result = validateVideoElement(videoElement({}, child), fakeRegistry);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(' ')).toMatch(/size/);
    }
  });

  it('errors on fragment as direct child', () => {
    const child = React.createElement(
      React.Fragment,
      null,
      React.createElement(Box.component, {
        start: 0,
        duration: 1,
        zIndex: 0,
        label: 'hi',
      }),
    );
    const result = validateVideoElement(videoElement({}, child), fakeRegistry);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(' ')).toMatch(/fragment/i);
    }
  });

  it('errors on plain DOM element as direct child', () => {
    const child = React.createElement('div', {
      start: 0,
      duration: 1,
      zIndex: 0,
    });
    const result = validateVideoElement(videoElement({}, child), fakeRegistry);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(' ')).toMatch(/registry|component/i);
    }
  });

  it('errors when start/duration/zIndex are invalid (delegates to collectScheduledChildren)', () => {
    const child = React.createElement(Box.component, {
      start: -1,
      duration: 1,
      zIndex: 0,
      label: 'hi',
    });
    const result = validateVideoElement(videoElement({}, child), fakeRegistry);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(' ')).toMatch(/start/);
    }
  });

  it('aggregates multiple errors instead of throwing on the first', () => {
    const bad1 = React.createElement(Box.component, {
      key: 'a',
      start: 0,
      duration: 1,
      zIndex: 0,
      // label missing
    } as never);
    const bad2 = React.createElement(Spacer.component, {
      key: 'b',
      start: 0,
      duration: 1,
      zIndex: 0,
      // size missing
    } as never);
    const result = validateVideoElement(
      videoElement({}, [bad1, bad2]),
      fakeRegistry,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    }
  });
});
