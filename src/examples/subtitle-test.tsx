import { Video } from '@/reel/Video';
import { Subtitle } from '@/components/Subtitle';

export default function SubtitleExample() {
  return (
    <Video width={1080} height={720} fps={24} duration={3}>
      <Subtitle
        start={0}
        duration={3}
        zIndex={0}
        content="Standalone subtitle example"
      />
    </Video>
  );
}
