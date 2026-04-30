import React from 'react';
import path from 'node:path';
import process from 'node:process';
import type { z } from 'zod';
import { Video, collectScheduledChildren } from '@/reel/Video';
import type { VideoComponent, TimelineProps } from '@/reel/component';
import { registry as defaultRegistry } from '@/reel/registry';

export type Registry = Record<string, VideoComponent<z.ZodTypeAny>>;

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

const POSITIVE_INT_FIELDS = ['width', 'height', 'fps'] as const;

function isPositiveInteger(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n > 0;
}

function describeChild(element: React.ReactElement, index: number): string {
  const t = element.type;
  if (t === React.Fragment) return `child[${index}] (Fragment)`;
  if (typeof t === 'string') return `child[${index}] (<${t}>)`;
  if (typeof t === 'function') return `child[${index}] (${t.name || 'anonymous'})`;
  return `child[${index}]`;
}

function findRegistryEntry(
  element: React.ReactElement,
  registry: Registry,
): { name: string; entry: VideoComponent<z.ZodTypeAny> } | null {
  for (const [name, entry] of Object.entries(registry)) {
    if (element.type === entry.component) return { name, entry };
  }
  return null;
}

export function validateVideoElement(
  element: unknown,
  registry: Registry = defaultRegistry as unknown as Registry,
): ValidationResult {
  const errors: string[] = [];

  if (!React.isValidElement(element)) {
    return { ok: false, errors: ['Expected the default export to return a React element.'] };
  }

  if (element.type !== Video) {
    return {
      ok: false,
      errors: ['The default export of src/video.tsx must return exactly one <Video> element.'],
    };
  }

  const props = element.props as {
    width: unknown;
    height: unknown;
    fps: unknown;
    duration?: unknown;
    children?: React.ReactNode;
  };

  for (const field of POSITIVE_INT_FIELDS) {
    if (!isPositiveInteger(props[field])) {
      errors.push(
        `<Video ${field}> must be a positive integer (got ${String(props[field])}).`,
      );
    }
  }

  if (props.duration !== undefined) {
    if (typeof props.duration !== 'number' || !Number.isFinite(props.duration) || props.duration <= 0) {
      errors.push(
        `<Video duration> must be a positive finite number when provided (got ${String(props.duration)}).`,
      );
    }
  }

  const childElements = React.Children.toArray(props.children);
  childElements.forEach((child, index) => {
    if (!React.isValidElement(child)) {
      errors.push(`${describeChild(child as never, index)}: must be a React element.`);
      return;
    }

    if (child.type === React.Fragment) {
      errors.push(
        `${describeChild(child, index)}: fragments are not allowed as direct children of <Video>.`,
      );
      return;
    }

    if (typeof child.type === 'string') {
      errors.push(
        `${describeChild(child, index)}: only registered components are allowed as direct children of <Video>.`,
      );
      return;
    }

    const registryHit = findRegistryEntry(child, registry);
    if (!registryHit) {
      errors.push(
        `${describeChild(child, index)}: component is not present in the registry.`,
      );
      return;
    }

    const childProps = child.props as Record<string, unknown> & TimelineProps;
    const { start, duration, zIndex, ...rest } = childProps;
    if (!Number.isFinite(start) || start < 0) {
      errors.push(`${describeChild(child, index)}: start must be a finite number >= 0.`);
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      errors.push(`${describeChild(child, index)}: duration must be a finite number > 0.`);
    }
    if (!Number.isInteger(zIndex)) {
      errors.push(`${describeChild(child, index)}: zIndex must be an integer.`);
    }

    const parsed = registryHit.entry.schema.safeParse(rest);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const where = issue.path.length ? issue.path.join('.') : '(root)';
        errors.push(
          `${describeChild(child, index)} (${registryHit.name}): ${where} — ${issue.message}`,
        );
      }
    }
  });

  if (errors.length === 0 && props.duration !== undefined) {
    try {
      const last = Math.max(
        0,
        ...collectScheduledChildren(props.children).map(
          (c) => c.props.start + c.props.duration,
        ),
      );
      if ((props.duration as number) + 1e-9 < last) {
        errors.push(
          `<Video duration=${props.duration}> does not cover the last scheduled child end (${last}).`,
        );
      }
    } catch (e) {
      errors.push(`Failed to compute scheduled children: ${(e as Error).message}`);
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

export async function validateProject(projectRoot: string): Promise<ValidationResult> {
  const errors: string[] = [];

  const indexPath = path.join(projectRoot, 'src/index.ts');
  const videoPath = path.join(projectRoot, 'src/video.tsx');

  let videoModule: { default?: () => React.ReactElement };
  try {
    videoModule = await import(videoPath);
  } catch (e) {
    return {
      ok: false,
      errors: [`Failed to import ${videoPath}: ${(e as Error).message}`],
    };
  }

  if (typeof videoModule.default !== 'function') {
    return {
      ok: false,
      errors: ['src/video.tsx must export a default function returning <Video>.'],
    };
  }

  const VideoSource = videoModule.default;
  let element: React.ReactElement;
  try {
    element = VideoSource();
  } catch (e) {
    return {
      ok: false,
      errors: [`Calling default export of src/video.tsx threw: ${(e as Error).message}`],
    };
  }

  const elementResult = validateVideoElement(element);
  if (!elementResult.ok) {
    errors.push(...elementResult.errors);
  }

  let indexSource: string;
  try {
    const fs = await import('node:fs/promises');
    indexSource = await fs.readFile(indexPath, 'utf8');
  } catch (e) {
    return {
      ok: false,
      errors: [...errors, `Failed to read ${indexPath}: ${(e as Error).message}`],
    };
  }

  if (!/exportVideo\s*\(/.test(indexSource)) {
    errors.push('src/index.ts must call exportVideo(VideoSource).');
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

async function main() {
  const projectRoot = process.cwd();
  const result = await validateProject(projectRoot);
  if (result.ok) {
    console.log('validate: ok');
    process.exit(0);
  }
  console.error('validate: failed');
  for (const err of result.errors) console.error(`  - ${err}`);
  process.exit(1);
}

const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  /validate\.(t|j)sx?$/.test(process.argv[1]);

if (isDirectRun) {
  void main();
}

