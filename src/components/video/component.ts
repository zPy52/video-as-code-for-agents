import type { ComponentType } from 'react';
import type { z } from 'zod';

export type TimelineProps = {
  start: number;
  duration: number;
  zIndex: number;
};

export type VideoComponent<TSchema extends z.ZodTypeAny = z.ZodTypeAny> = {
  name: string;
  description?: string;
  schema: TSchema;
  component: ComponentType<z.input<TSchema> & TimelineProps>;
};

export function defineVideoComponent<TSchema extends z.ZodTypeAny>(
  input: VideoComponent<TSchema>,
) {
  return input;
}
