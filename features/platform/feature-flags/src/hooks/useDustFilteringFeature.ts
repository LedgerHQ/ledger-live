import { useSelector } from "react-redux";
import { selectFeature, type WithFeatureFlags } from "@shared/feature-flags";
import type { WalletPlatform } from "./useWalletFeaturesConfig";

export const DUST_FILTERING_FEATURE_FLAG_KEYS = {
  desktop: "lwdDustFiltering",
  mobile: "lwmDustFiltering",
} as const;

export type DustFilteringFeatureConfig = Readonly<{
  isEnabled: boolean;
}>;

export function selectDustFilteringEnabled(
  state: WithFeatureFlags,
  platform: WalletPlatform,
): boolean {
  return selectFeature(state, DUST_FILTERING_FEATURE_FLAG_KEYS[platform])?.enabled === true;
}

export function useDustFilteringFeature(platform: WalletPlatform): DustFilteringFeatureConfig {
  const isEnabled = useSelector((state: WithFeatureFlags) =>
    selectDustFilteringEnabled(state, platform),
  );

  return { isEnabled };
}
