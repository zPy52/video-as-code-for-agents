import { Video } from '@/reel/Video';
import { Subtitle } from '@/components/Subtitle';
import { PresenterCard } from '@/components/PresenterCard';

export default function MyVideo() {
  return (
    <Video width={1080} height={720} fps={24}>
      <Subtitle
        start={0}
        duration={3}
        zIndex={0}
        content="This is the subtitle of this frame"
      />
      <Subtitle
        start={1}
        duration={2}
        zIndex={1}
        content="Multiple overlays can render at the same time"
      />
      <PresenterCard
        start={4}
        duration={5}
        zIndex={2}
        name="Aaron Epstein"
        title="Group Partner, Y Combinator"
      />
    </Video>
  );
}
