import { describe, expect, it } from 'vitest';
import { parseComponentArgs } from '@/reel/render-component';

describe('parseComponentArgs', () => {
  it('parses positional component name and props JSON', () => {
    const r = parseComponentArgs(['Subtitle', '--props', '{"content":"hi"}']);
    expect(r.name).toBe('Subtitle');
    expect(r.props).toEqual({ content: 'hi' });
  });

  it('defaults background to black, duration from props if available', () => {
    const r = parseComponentArgs([
      'Subtitle',
      '--props',
      '{"content":"hi","start":0,"duration":4,"zIndex":0}',
    ]);
    expect(r.background).toBe('black');
    expect(r.duration).toBe(4);
  });

  it('parses --background, --duration, --out', () => {
    const r = parseComponentArgs([
      'Subtitle',
      '--props',
      '{"content":"hi"}',
      '--background',
      '#222',
      '--duration',
      '6',
      '--out',
      'out/x.mp4',
    ]);
    expect(r.background).toBe('#222');
    expect(r.duration).toBe(6);
    expect(r.out).toBe('out/x.mp4');
  });

  it('throws when component name is missing', () => {
    expect(() => parseComponentArgs(['--props', '{}'])).toThrow(/component name/i);
  });

  it('throws when --props is missing', () => {
    expect(() => parseComponentArgs(['Subtitle'])).toThrow(/--props/);
  });

  it('throws when --props is not valid JSON', () => {
    expect(() => parseComponentArgs(['Subtitle', '--props', 'not-json'])).toThrow(
      /JSON/i,
    );
  });

  it('falls back to duration=3 when neither flag nor props provide it', () => {
    const r = parseComponentArgs(['Subtitle', '--props', '{"content":"hi"}']);
    expect(r.duration).toBe(3);
  });

  it('skips a leading -- separator (passed by pnpm)', () => {
    const r = parseComponentArgs(['--', 'Subtitle', '--props', '{"content":"hi"}']);
    expect(r.name).toBe('Subtitle');
    expect(r.props).toEqual({ content: 'hi' });
  });
});
