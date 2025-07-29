import { useCallback } from "react";
import { track } from "~/analytics/segment";
import {
  MODULAR_DRAWER_PAGE_NAME,
  ModularDrawerEventName,
  ModularDrawerEventParams,
} from "./modularDrawer.types";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { formatAssetsConfig, formatNetworksConfig } from "./utils";
import { ModularDrawerStep } from "../types";

type DrawerConfig = {
  formatNetworkConfig?: boolean;
  formatAssetConfig?: boolean;
  assetsConfig?: EnhancedModularDrawerConfiguration["assets"];
  networksConfig?: EnhancedModularDrawerConfiguration["networks"];
};

type TrackModularDrawerEvent = <T extends ModularDrawerEventName>(
  eventName: T,
  params: ModularDrawerEventParams[T],
  drawerConfig?: DrawerConfig,
) => void;

export const useModularDrawerAnalytics = () => {
  const trackModularDrawerEvent = useCallback<TrackModularDrawerEvent>(
    (eventName, params, drawerConfig) => {
      const { formatNetworkConfig, formatAssetConfig, assetsConfig, networksConfig } =
        drawerConfig || {};
      const analyticsParams = {
        ...params,
        ...(formatAssetConfig && { asset_component_features: formatAssetsConfig(assetsConfig) }),
        ...(formatNetworkConfig && {
          network_component_features: formatNetworksConfig(networksConfig),
        }),
      };

      track(eventName, analyticsParams);
    },
    [],
  );

  return { trackModularDrawerEvent };
};

/**
 * Get the current page name for analytics based on the current step
 */
export const PAGE_NAME_MAP = {
  [ModularDrawerStep.Asset]: MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION,
  [ModularDrawerStep.Network]: MODULAR_DRAWER_PAGE_NAME.MODULAR_NETWORK_SELECTION,
  [ModularDrawerStep.Account]: MODULAR_DRAWER_PAGE_NAME.MODULAR_ACCOUNT_SELECTION,
};

export const getCurrentPageName = (currentStep: ModularDrawerStep) => {
  return PAGE_NAME_MAP[currentStep] ?? MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION;
};
