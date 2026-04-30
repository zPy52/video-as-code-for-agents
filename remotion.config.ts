import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...(config.resolve?.alias ?? {}),
      '@': require('path').resolve(__dirname, 'src'),
    },
  },
}));
