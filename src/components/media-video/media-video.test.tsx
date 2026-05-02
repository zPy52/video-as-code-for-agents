import { describe, expect, it } from 'vitest';
import MediaVideoComponent, {
  MediaVideo,
  mediaVideoSchema,
} from '@/components/media-video/media-video';

describe('mediaVideoSchema', () => {
  it('parses src and defaults fit to "cover"', () => {
    const v = mediaVideoSchema.parse({ src: 'foo.mp4' });
    expect(v.src).toBe('foo.mp4');
    expect(v.fit).toBe('cover');
  });

  it('rejects unknown fit values', () => {
    expect(() =>
      mediaVideoSchema.parse({ src: 'a.mp4', fit: 'fill' }),
    ).toThrow();
  });

  it('zoom is optional', () => {
    const v = mediaVideoSchema.parse({ src: 'a.mp4' });
    expect(v.zoom).toBeUndefined();
  });

  it('parses a zoom config with multiple keyframes and motion blur', () => {
    const v = mediaVideoSchema.parse({
      src: 'a.mp4',
      zoom: {
        keyframes: [
          { at: 0, scale: 1 },
          { at: 1, scale: 1.8, transition: { duration: 0.5, easing: 'easeInOut' } },
          { at: 3, scale: 1, transition: { duration: 1 } },
        ],
        motionBlur: true,
      },
    });
    expect(v.zoom?.keyframes).toHaveLength(3);
    expect(v.zoom?.motionBlur).toBe(true);
  });

  it('rejects out-of-order zoom keyframes', () => {
    expect(() =>
      mediaVideoSchema.parse({
        src: 'a.mp4',
        zoom: { keyframes: [{ at: 1 }, { at: 0 }] },
      }),
    ).toThrow();
  });
});

describe('MediaVideo registration', () => {
  it('exports a registered VideoComponent', () => {
    expect(MediaVideoComponent.name).toBe('MediaVideo');
    expect(MediaVideoComponent.schema).toBe(mediaVideoSchema);
    expect(MediaVideoComponent.component).toBe(MediaVideo);
  });
});
