import { useFeature } from "../../featureFlags";
import { EnhancedModularDrawerConfiguration } from "../../wallet-api/ModularDrawer/types";

const assetConfigurationDisabled: EnhancedModularDrawerConfiguration["assets"] = {
  rightElement: "undefined",
  leftElement: "undefined",
  filter: "undefined",
};

const networkConfigurationDisabled: EnhancedModularDrawerConfiguration["networks"] = {
  rightElement: "undefined",
  leftElement: "undefined",
};

export const useModularDrawerConfiguration = (
  featureFlagKey: "lldModularDrawer" | "llmModularDrawer",
  drawerConfiguration?: EnhancedModularDrawerConfiguration,
) => {
  const featureModularDrawer = useFeature(featureFlagKey);

  const modularizationEnabled = featureModularDrawer?.params?.enableModularization ?? false;
  const assetsConfiguration = modularizationEnabled
    ? drawerConfiguration?.assets
    : assetConfigurationDisabled;
  const networkConfiguration = modularizationEnabled
    ? drawerConfiguration?.networks
    : networkConfigurationDisabled;

  return {
    assetsConfiguration,
    networkConfiguration,
  };
};
