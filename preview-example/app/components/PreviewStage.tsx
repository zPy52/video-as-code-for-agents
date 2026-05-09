'use client';

import { Preview, usePreview } from 'video-as-code-for-agents/preview';
import { AaronVideo } from './AaronVideo';

function MonoTimecode() {
  const { currentTime, duration } = usePreview();
  const fmt = (s: number) => {
    const total = Math.max(0, s);
    const m = Math.floor(total / 60);
    const sec = Math.floor(total % 60).toString().padStart(2, '0');
    const ms = Math.floor((total % 1) * 100).toString().padStart(2, '0');
    return `${m}:${sec}.${ms}`;
  };
  return (
    <span className="timecode">
      <span className="timecode__current">{fmt(currentTime)}</span>
      <span className="timecode__sep"> / </span>
      <span className="timecode__total">{fmt(duration)}</span>
    </span>
  );
}

export function PreviewStage() {
  return (
    <div className="stage">
      <div className="stage__strip" aria-hidden />
      <div className="stage__frame">
        <Preview
          showControls
          loop
          classNames={{
            container: 'preview',
            player: 'preview__player',
            controls: 'preview__controls',
            playButton: 'preview__play',
            slider: 'preview__slider',
            timeLabel: 'preview__time',
          }}
          slots={{
            timeLabel: <MonoTimecode />,
          }}
        >
          {AaronVideo()}
        </Preview>
      </div>
      <div className="stage__caption">
        <span className="stage__caption-num">01</span>
        <span className="stage__caption-text">
          Aaron Epstein, Group Partner at Y Combinator — opening title card &amp;
          mid-roll lower-third, generated entirely from React components.
        </span>
      </div>
    </div>
  );
}
