import { Logo } from './components/Logo';
import { Subtitle } from './components/Subtitle';
import { Video } from 'video-as-code-for-agents';
import { Highlight } from './components/Highlight';
import { IntroScene } from './components/IntroScene';
import { LowerThird } from './components/LowerThird';
import { PresenterCard } from './components/PresenterCard';

export default function MyVideo() {
  return (
    <Video width={1080} height={720} fps={24}>
      <IntroScene
        start={0}
        duration={3}
        zIndex={0}
        title="My Videos"
        subtitle="A private scratch space for scene building"
      />
      <Logo
        start={0}
        duration={6}
        zIndex={1}
        src="https://placehold.co/320x120/png"
        alt="Logo"
        position="top-right"
      />
      <Subtitle
        start={0}
        duration={3}
        zIndex={2}
        content="This is the subtitle of this frame"
      />
      <LowerThird
        start={1}
        duration={3}
        zIndex={3}
        name="Palovid"
        title="Video components sandbox"
      />
      <PresenterCard
        start={4}
        duration={5}
        zIndex={4}
        name="Aaron Epstein"
        title="Group Partner, Y Combinator"
      />
      <Highlight
        start={4}
        duration={5}
        zIndex={4}
        text="Build videos from your own components"
      />
    </Video>
  );
}
