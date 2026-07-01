import { useFeature } from "./useFeature";
import type { WalletPlatform } from "./useWalletFeaturesConfig";

export const DUST_FILTERING_FEATURE_FLAG_KEYS = {
  desktop: "lwdDustFiltering",
  mobile: "lwmDustFiltering",
} as const;

export type DustFilteringFeatureConfig = Readonly<{
  isEnabled: boolean;
}>;

export function useDustFilteringFeature(platform: WalletPlatform): DustFilteringFeatureConfig {
  const feature = useFeature(DUST_FILTERING_FEATURE_FLAG_KEYS[platform]);

  return {
    isEnabled: feature?.enabled === true,
  };
}
