import { describe, expect, test } from 'vitest';
import {
  Video,
  defineVideoComponent,
  exportVideo,
  useTimelineItem,
  useVideoConfig,
} from '@/index';

describe('public SDK exports', () => {
  test('exports the video authoring and rendering API from src/index.ts', () => {
    expect(Video).toBeTypeOf('function');
    expect(defineVideoComponent).toBeTypeOf('function');
    expect(exportVideo).toBeTypeOf('function');
    expect(useTimelineItem).toBeTypeOf('function');
    expect(useVideoConfig).toBeTypeOf('function');
  });
});
