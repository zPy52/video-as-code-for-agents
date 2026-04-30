import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import type { TimelineProps } from './component';
import { TimelineItemProvider } from './time';

export type VideoProps = {
  width: number;
  height: number;
  fps: number;
  duration?: number;
  children: React.ReactNode;
};

export type ScheduledChild = {
  key: React.Key;
  element: React.ReactElement<TimelineProps>;
  props: TimelineProps;
  index: number;
};

export function secondsToFrames(seconds: number, fps: number): number {
  return Math.round(seconds * fps);
}

export function collectScheduledChildren(children: React.ReactNode): ScheduledChild[] {
  return React.Children.toArray(children).map((child, index) => {
    if (!React.isValidElement<TimelineProps>(child)) {
      throw new Error(
        '<Video> children must be React elements with start, duration, and zIndex.',
      );
    }

    const { start, duration, zIndex } = child.props;
    if (!Number.isFinite(start) || start < 0) {
      throw new Error(`Video child start must be a finite number >= 0 (got ${start}).`);
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error(`Video child duration must be a finite number > 0 (got ${duration}).`);
    }
    if (!Number.isInteger(zIndex)) {
      throw new Error(`Video child zIndex must be an integer (got ${zIndex}).`);
    }

    return {
      key: child.key ?? index,
      element: child,
      props: { start, duration, zIndex },
      index,
    };
  });
}

export function getVideoDuration(
  children: React.ReactNode,
  explicitDuration?: number,
): number {
  if (explicitDuration !== undefined) return explicitDuration;
  const scheduled = collectScheduledChildren(children);
  return Math.max(1, ...scheduled.map((c) => c.props.start + c.props.duration));
}

export function Video(props: VideoProps) {
  const scheduled = collectScheduledChildren(props.children).sort(
    (a, b) => a.props.zIndex - b.props.zIndex || a.index - b.index,
  );

  return (
    <AbsoluteFill>
      {scheduled.map(({ key, element, props: timing }) => (
        <Sequence
          key={key}
          from={secondsToFrames(timing.start, props.fps)}
          durationInFrames={secondsToFrames(timing.duration, props.fps)}
          style={{ zIndex: timing.zIndex }}
        >
          <TimelineItemProvider {...timing} fps={props.fps}>
            {element}
          </TimelineItemProvider>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
