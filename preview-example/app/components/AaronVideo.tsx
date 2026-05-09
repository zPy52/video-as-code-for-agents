import { Video } from 'video-as-code-for-agents';
import { Highlight } from './Highlight';
import { PresenterCard } from './PresenterCard';

export function AaronVideo() {
  return (
    <Video width={1080} height={720} fps={24}>
      <PresenterCard
        start={0}
        duration={4}
        zIndex={1}
        name="Aaron Epstein"
        title="Group Partner, Y Combinator"
      />
      <Highlight
        start={4}
        duration={4}
        zIndex={2}
        text="Build videos from your own components"
      />
    </Video>
  );
}
