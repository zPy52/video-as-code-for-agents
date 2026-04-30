import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export type ComponentArgs = {
  name: string;
  props: Record<string, unknown>;
  background: string;
  duration: number;
  out: string;
};

const FLAGS = new Set(['--props', '--background', '--duration', '--out']);

function nextValue(argv: string[], i: number, flag: string): string {
  const next = argv[i + 1];
  if (next === undefined || next.startsWith('--')) {
    throw new Error(`Flag ${flag} requires a value.`);
  }
  return next;
}

export function parseComponentArgs(argv: string[]): ComponentArgs {
  let name: string | undefined;
  let propsRaw: string | undefined;
  let background = 'black';
  let durationFlag: number | undefined;
  let out: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]!;
    if (token === '--') continue;
    if (!token.startsWith('--')) {
      if (name === undefined) {
        name = token;
        continue;
      }
      throw new Error(`Unexpected positional argument: ${token}`);
    }

    const eq = token.indexOf('=');
    const flag = eq === -1 ? token : token.slice(0, eq);
    if (!FLAGS.has(flag)) throw new Error(`Unknown flag: ${flag}`);

    const value = eq !== -1 ? token.slice(eq + 1) : nextValue(argv, i, flag);
    if (eq === -1) i++;

    if (flag === '--props') propsRaw = value;
    else if (flag === '--background') background = value;
    else if (flag === '--duration') durationFlag = Number(value);
    else if (flag === '--out') out = value;
  }

  if (name === undefined) {
    throw new Error('Missing component name. Usage: test:component <Name> --props \'{...}\'');
  }
  if (propsRaw === undefined) {
    throw new Error('Missing --props JSON.');
  }

  let props: Record<string, unknown>;
  try {
    props = JSON.parse(propsRaw);
  } catch (e) {
    throw new Error(`--props must be valid JSON: ${(e as Error).message}`);
  }

  const propsDuration = typeof props.duration === 'number' ? props.duration : undefined;
  const duration = durationFlag ?? propsDuration ?? 3;

  return {
    name,
    props,
    background,
    duration,
    out: out ?? path.join('out', `${name}-test.mp4`),
  };
}

const COMPONENT_TEST_ENTRY = `
// Remotion bundler scans for the literal "registerRoot"; exportVideo() calls it.
import React from 'react';
import { Video } from '@/reel/Video';
import { exportVideo } from '@/reel/export-video';
import { registry } from '@/reel/registry';
import { AbsoluteFill } from 'remotion';

const config = __CONFIG__;

function Background({ color }: { color: string }) {
  return <AbsoluteFill style={{ background: color }} />;
}

function VideoSource() {
  const entry = (registry as Record<string, { component: React.ComponentType<any> }>)[config.name];
  if (!entry) throw new Error('Unknown component: ' + config.name);
  const Component = entry.component;
  const childProps = {
    start: 0,
    duration: config.duration,
    zIndex: 0,
    ...config.props,
  };
  return (
    <Video width={config.width} height={config.height} fps={config.fps} duration={config.duration}>
      <Background color={config.background} start={0} duration={config.duration} zIndex={-1} />
      <Component {...childProps} />
    </Video>
  );
}

exportVideo(VideoSource);
`;

export async function renderComponent(projectRoot: string, args: ComponentArgs) {
  const { registry } = await import('@/reel/registry');
  const entry = (registry as Record<string, { schema: { safeParse: (v: unknown) => { success: boolean; error?: { issues: { path: (string | number)[]; message: string }[] } } } }>)[
    args.name
  ];
  if (!entry) {
    throw new Error(
      `Unknown component "${args.name}". Available: ${Object.keys(registry).join(', ')}`,
    );
  }

  const { start: _s, duration: _d, zIndex: _z, ...rest } = args.props as Record<string, unknown> & {
    start?: unknown;
    duration?: unknown;
    zIndex?: unknown;
  };
  const parsed = entry.schema.safeParse(rest);
  if (!parsed.success) {
    const issues = parsed.error?.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Props for ${args.name} failed schema validation:\n${issues}`);
  }

  const tmpDir = path.join(projectRoot, '.component-test');
  await fs.mkdir(tmpDir, { recursive: true });
  const tmpEntry = path.join(tmpDir, 'entry.tsx');
  const config = {
    name: args.name,
    props: rest,
    duration: args.duration,
    background: args.background,
    width: 1080,
    height: 720,
    fps: 24,
  };
  await fs.writeFile(
    tmpEntry,
    COMPONENT_TEST_ENTRY.replace('__CONFIG__', JSON.stringify(config)),
    'utf8',
  );

  try {
    const { bundle } = await import('@remotion/bundler');
    const { renderMedia, selectComposition } = await import('@remotion/renderer');
    const outputLocation = path.resolve(projectRoot, args.out);
    await fs.mkdir(path.dirname(outputLocation), { recursive: true });

    const serveUrl = await bundle({
      entryPoint: tmpEntry,
      webpackOverride: (config) => ({
        ...config,
        resolve: {
          ...config.resolve,
          alias: {
            ...(config.resolve?.alias ?? {}),
            '@': path.resolve(projectRoot, 'src'),
          },
        },
      }),
    });
    const composition = await selectComposition({ serveUrl, id: 'main' });
    await renderMedia({
      serveUrl,
      composition,
      codec: 'h264',
      outputLocation,
    });
    return { outputLocation };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

async function main() {
  const args = parseComponentArgs(process.argv.slice(2));
  const result = await renderComponent(process.cwd(), args);
  console.log(`test:component: wrote ${result.outputLocation}`);
}

const isDirectRun = (() => {
  if (typeof process === 'undefined' || !process.argv[1]) return false;
  try {
    return process.argv[1] === fileURLToPath(import.meta.url);
  } catch {
    return /render-component\.(t|j)s$/.test(process.argv[1]);
  }
})();

if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
