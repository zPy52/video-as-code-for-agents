import IntroScene from '@/components/IntroScene';
import Logo from '@/components/Logo';
import LowerThird from '@/components/LowerThird';
import PresenterCard from '@/components/PresenterCard';
import Subtitle from '@/components/Subtitle';

export const registry = {
  IntroScene,
  Logo,
  LowerThird,
  PresenterCard,
  Subtitle,
} as const;

export type RegistryKey = keyof typeof registry;
