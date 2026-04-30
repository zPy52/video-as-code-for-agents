import { Video } from 'video-as-code-for-agents';
import { Highlight } from './components/Highlight';
import { PresenterCard } from './components/PresenterCard';
import { NumberedListPanel } from './components/NumberedListPanel';

export default function MyVideo() {
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
      <NumberedListPanel
        start={8}
        duration={6}
        zIndex={3}
        title="Get warm intro through LinkedIn:"
        items={[
          'Friends',
          'Friends of friends',
          'Current/former coworkers',
          'School alumni networks',
          'Employer alumni networks',
        ]}
      />
    </Video>
  );
}
