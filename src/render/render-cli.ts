#!/usr/bin/env -S tsx
import process from 'node:process';
import { runRenderCli } from './render';

runRenderCli().catch((err) => {
  console.error(err);
  process.exit(1);
});
