/**
 * MCP capability manifest for the video-as-code coding agent workspace.
 *
 * v1 intentionally does NOT ship video-specific tools (`render_video`,
 * `read_video_source`, etc). Instead it documents the constrained shell +
 * filesystem surface an MCP host should expose so that a coding agent can
 * author `src/video.tsx`, edit components, and drive renders through the
 * project's normal `pnpm` commands.
 */

export type McpCapability = {
  id: string;
  description: string;
};

export type McpCommandHint = {
  command: string;
  description: string;
};

export const mcpCapabilities: McpCapability[] = [
  { id: 'read_file', description: 'Inspect src/video.tsx, components, config, and command output artifacts.' },
  { id: 'write_file', description: 'Edit src/video.tsx, create components, update styles, and add asset metadata.' },
  { id: 'patch_file', description: 'Apply structured edits to existing files.' },
  { id: 'grep', description: 'Discover components, registry entries, props, and examples.' },
  { id: 'list_files', description: 'Understand project structure and available assets.' },
  { id: 'shell', description: 'Run pnpm install, pnpm add, pnpm typecheck, pnpm validate, pnpm render, and component tests.' },
];

export const mcpRecommendedCommands: McpCommandHint[] = [
  { command: 'pnpm install', description: 'Install project dependencies.' },
  { command: 'pnpm add <pkg>', description: 'Add a runtime dependency (e.g. motion, lucide-react).' },
  { command: 'pnpm typecheck', description: 'Run TypeScript checking.' },
  { command: 'pnpm validate', description: 'Validate <Video> contract and registry schemas.' },
  { command: 'pnpm render -- --entry src/index.ts --out out/main.mp4', description: 'Render the final video to MP4.' },
  { command: "pnpm test:component -- Subtitle --props '{\"content\":\"Hello\",\"start\":0,\"duration\":3,\"zIndex\":0}' --out out/subtitle-test.mp4", description: 'Render a single registered component in isolation.' },
];

export const mcpManifest = {
  name: 'video-as-code',
  version: '0.1.0',
  capabilities: mcpCapabilities,
  recommendedCommands: mcpRecommendedCommands,
} as const;
