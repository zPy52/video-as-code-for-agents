import { Config } from '@remotion/cli/config';
import path from 'path';

Config.setVideoImageFormat('jpeg');
Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...(config.resolve?.alias ?? {}),
      '@': path.resolve(process.cwd(), 'src'),
    },
    fallback: {
      ...(config.resolve?.fallback ?? {}),
      path: false,
      url: false,
    },
  },
}));
