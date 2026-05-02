import { describe, expect, test } from 'vitest';
import {
  MediaVideo,
  Video,
  ZoomEffect,
  defineVideoComponent,
  exportVideo,
  getZoomState,
  getZoomStyle,
  mediaVideoSchema,
  resolveEasing,
  resolveZoomKeyframes,
  resolveZoomMotionBlur,
  useTimelineItem,
  useVideoConfig,
  zoomEffectSchema,
  zoomKeyframeSchema,
} from '@/index';

describe('public SDK exports', () => {
  test('exports the video authoring and rendering API from src/index.ts', () => {
    expect(Video).toBeTypeOf('function');
    expect(defineVideoComponent).toBeTypeOf('function');
    expect(exportVideo).toBeTypeOf('function');
    expect(useTimelineItem).toBeTypeOf('function');
    expect(useVideoConfig).toBeTypeOf('function');
  });

  test('exports the zoom + MediaVideo API', () => {
    expect(ZoomEffect).toBeTypeOf('function');
    expect(getZoomState).toBeTypeOf('function');
    expect(getZoomStyle).toBeTypeOf('function');
    expect(resolveEasing).toBeTypeOf('function');
    expect(resolveZoomKeyframes).toBeTypeOf('function');
    expect(resolveZoomMotionBlur).toBeTypeOf('function');
    expect(MediaVideo).toBeTypeOf('function');
    expect(zoomEffectSchema).toBeDefined();
    expect(zoomKeyframeSchema).toBeDefined();
    expect(mediaVideoSchema).toBeDefined();
  });
});
