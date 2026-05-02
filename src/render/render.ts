import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';

export type RenderArgs = {
  entry: string;
  out: string;
};

const KNOWN_FLAGS = new Set(['--entry', '--out']);
const require = createRequire(import.meta.url);
const studioRenderEntry = path.join(
  path.dirname(require.resolve('@remotion/studio/renderEntry')),
  'esm',
  'renderEntry.mjs',
);

export function parseRenderArgs(argv: string[]): RenderArgs {
  let entry = 'src/index.ts';
  let out = path.join('out', 'main.mp4');

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]!;
    if (token === '--') continue;
    const eq = token.indexOf('=');
    const flag = eq === -1 ? token : token.slice(0, eq);

    if (!flag.startsWith('--')) {
      throw new Error(`Unexpected positional argument: ${token}`);
    }
    if (!KNOWN_FLAGS.has(flag)) {
      throw new Error(`Unknown flag: ${flag}`);
    }

    let value: string;
    if (eq !== -1) {
      value = token.slice(eq + 1);
    } else {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        throw new Error(`Flag ${flag} requires a value.`);
      }
      value = next;
      i++;
    }

    if (flag === '--entry') entry = value;
    else if (flag === '--out') out = value;
  }

  return { entry, out };
}

export async function renderVideo(
  projectRoot: string,
  args: RenderArgs = { entry: 'src/index.ts', out: 'out/main.mp4' },
) {
  const { bundle } = await import('@remotion/bundler');
  const { renderMedia, selectComposition } = await import('@remotion/renderer');

  const entryPoint = path.resolve(projectRoot, args.entry);
  const outputLocation = path.resolve(projectRoot, args.out);

  const serveUrl = await bundle({
    entryPoint,
    ignoreRegisterRootWarning: true,
    webpackOverride: (config) => {
      const { '@remotion/studio': _studioAlias, ...alias } = aliasObject(
        config.resolve?.alias,
      );

      return {
        ...config,
        resolve: {
          ...config.resolve,
          alias: {
            ...alias,
            '@': path.resolve(projectRoot, 'src'),
            '@remotion/studio/renderEntry': studioRenderEntry,
          },
          fallback: {
            ...(config.resolve?.fallback ?? {}),
            path: require.resolve('path-browserify'),
            url: require.resolve('url/'),
          },
        },
      };
    },
  });
  const composition = await selectComposition({ serveUrl, id: 'main' });

  await renderMedia({
    serveUrl,
    composition,
    codec: 'h264',
    outputLocation,
  });

  return { outputLocation };
}

function aliasObject(alias: unknown): Record<string, string> {
  return alias && !Array.isArray(alias) ? (alias as Record<string, string>) : {};
}

export async function runRenderCli(
  argv = process.argv.slice(2),
  projectRoot = process.cwd(),
) {
  const args = parseRenderArgs(argv);
  const result = await renderVideo(projectRoot, args);
  console.log(`render: wrote ${result.outputLocation}`);
}
