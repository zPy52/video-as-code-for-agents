import { describe, expect, it } from 'vitest';
import React from 'react';
import { z } from 'zod';
import { Composition } from 'remotion';
import { Video } from '@/reel/Video';
import { defineVideoComponent } from '@/reel/component';
import { createRoot } from '@/reel/export-video';

const Box = defineVideoComponent({
  name: 'Box',
  schema: z.object({}),
  component: () => null,
});

function makeSource(props: { width: number; height: number; fps: number; duration?: number }, end: number) {
  return function VideoSource() {
    return React.createElement(
      Video,
      props as React.ComponentProps<typeof Video>,
      React.createElement(Box.component, {
        start: 0,
        duration: end,
        zIndex: 0,
      }),
    );
  };
}

describe('createRoot', () => {
  it('returns a Root component that renders a single <Composition id="main">', () => {
    const Root = createRoot(makeSource({ width: 1080, height: 720, fps: 24 }, 3));
    const rendered = Root() as React.ReactElement;
    expect(rendered.type).toBe(Composition);
    expect((rendered.props as { id: string }).id).toBe('main');
  });

  it('passes width, height, fps from <Video> props to <Composition>', () => {
    const Root = createRoot(makeSource({ width: 1920, height: 1080, fps: 30 }, 2));
    const rendered = Root() as React.ReactElement<{ width: number; height: number; fps: number }>;
    expect(rendered.props.width).toBe(1920);
    expect(rendered.props.height).toBe(1080);
    expect(rendered.props.fps).toBe(30);
  });

  it('derives durationInFrames from latest scheduled child end when duration is omitted', () => {
    const Root = createRoot(makeSource({ width: 100, height: 100, fps: 24 }, 2.5));
    const rendered = Root() as React.ReactElement<{ durationInFrames: number }>;
    expect(rendered.props.durationInFrames).toBe(60);
  });

  it('uses explicit duration when provided', () => {
    const Root = createRoot(makeSource({ width: 100, height: 100, fps: 24, duration: 5 }, 2));
    const rendered = Root() as React.ReactElement<{ durationInFrames: number }>;
    expect(rendered.props.durationInFrames).toBe(120);
  });
});
