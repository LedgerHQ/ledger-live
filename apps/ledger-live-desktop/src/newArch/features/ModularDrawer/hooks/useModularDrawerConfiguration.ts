import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";

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
  drawerConfiguration?: EnhancedModularDrawerConfiguration,
) => {
  const featureModularDrawer = useFeature("lldModularDrawer");

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
