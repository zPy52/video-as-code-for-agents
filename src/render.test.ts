import { describe, expect, it } from 'vitest';
import { parseRenderArgs } from '@/render';

describe('parseRenderArgs', () => {
  it('returns defaults when no args are passed', () => {
    const r = parseRenderArgs([]);
    expect(r.entry).toBe('src/index.ts');
    expect(r.out).toMatch(/out\/main\.mp4$/);
  });

  it('parses --entry and --out flags', () => {
    const r = parseRenderArgs(['--entry', 'src/index.ts', '--out', 'out/x.mp4']);
    expect(r.entry).toBe('src/index.ts');
    expect(r.out).toBe('out/x.mp4');
  });

  it('parses --entry=path and --out=path', () => {
    const r = parseRenderArgs(['--entry=src/index.ts', '--out=out/y.mp4']);
    expect(r.entry).toBe('src/index.ts');
    expect(r.out).toBe('out/y.mp4');
  });

  it('throws when a flag has no value', () => {
    expect(() => parseRenderArgs(['--out'])).toThrow(/--out/);
  });

  it('throws on unknown flags', () => {
    expect(() => parseRenderArgs(['--bogus', 'x'])).toThrow(/--bogus/);
  });

  it('skips a leading -- separator (passed by pnpm)', () => {
    const r = parseRenderArgs(['--', '--entry', 'src/a.ts', '--out', 'out/b.mp4']);
    expect(r.entry).toBe('src/a.ts');
    expect(r.out).toBe('out/b.mp4');
  });
});
