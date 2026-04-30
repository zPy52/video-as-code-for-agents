import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { getVideoDuration, secondsToFrames, type VideoProps } from '@/reel/Video';

export type VideoSourceComponent = () => React.ReactElement<VideoProps>;

export function createRoot(VideoSource: VideoSourceComponent) {
  const videoElement = VideoSource();
  const { width, height, fps, duration, children } = videoElement.props;
  const durationSeconds = getVideoDuration(children, duration);

  return function Root() {
    return (
      <Composition
        id="main"
        component={VideoSource}
        width={width}
        height={height}
        fps={fps}
        durationInFrames={secondsToFrames(durationSeconds, fps)}
      />
    );
  };
}

export function exportVideo(VideoSource: VideoSourceComponent) {
  registerRoot(createRoot(VideoSource));
}
