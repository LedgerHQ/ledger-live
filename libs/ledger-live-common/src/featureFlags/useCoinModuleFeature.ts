import useFeature from "./useFeature";
import { isSupportedFeature } from "../bridge/features";
import type { FeatureId } from "@ledgerhq/types-live";

export const useCoinModuleFeature = <T extends FeatureId>(
  featureId: T,
  family: string,
): boolean => {
  const coinModuleFeature = useFeature<T>(featureId) as any;

  if (!coinModuleFeature) {
    return false;
  }

  if (!["xrp", "evm", "stellar", "tezos"].includes(family)) {
    // We ignore non generic alpaca families
    return true;
  }

  if (
    !coinModuleFeature.enabled ||
    !coinModuleFeature.params?.featureConfig.find(statusConfig =>
      statusConfig.families.includes(family),
    )
  ) {
    return false;
  }

  return isSupportedFeature(
    family,
    coinModuleFeature.params?.featureGroup as any,
    coinModuleFeature.params?.featureId as any,
  );
};
