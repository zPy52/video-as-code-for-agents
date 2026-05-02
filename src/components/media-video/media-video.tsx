import { z } from 'zod';
import { AbsoluteFill, OffthreadVideo } from 'remotion';
import { defineVideoComponent, type TimelineProps } from '../video/component';
import { ZoomEffect, zoomEffectSchema } from '../../effects/zoom/zoom-effect';

export const mediaVideoSchema = z.object({
  src: z.string(),
  fit: z.enum(['cover', 'contain']).default('cover'),
  zoom: zoomEffectSchema.optional(),
});

type MediaVideoProps = z.input<typeof mediaVideoSchema> & TimelineProps;

export function MediaVideo(props: MediaVideoProps) {
  const video = (
    <OffthreadVideo
      src={props.src}
      style={{
        width: '100%',
        height: '100%',
        objectFit: props.fit ?? 'cover',
      }}
    />
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {props.zoom ? (
        <ZoomEffect
          keyframes={props.zoom.keyframes}
          motionBlur={props.zoom.motionBlur}
        >
          {video}
        </ZoomEffect>
      ) : (
        video
      )}
    </AbsoluteFill>
  );
}

export default defineVideoComponent({
  name: 'MediaVideo',
  description: 'Full-frame video layer for local or remote video sources.',
  schema: mediaVideoSchema,
  component: MediaVideo,
});
