// @flow
import React from "react";
import {
  allowDebugAppsSelector,
  catalogProviderSelector,
  allowExperimentalAppsSelector,
} from "~/renderer/reducers/settings";
import { useSelector } from "react-redux";
import { RemoteLiveAppProvider } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LocalLiveAppProvider } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import { GlobalCatalogProvider } from "@ledgerhq/live-common/platform/providers/GlobalCatalogProvider/index";
import { RampCatalogProvider } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";

type PlatformAppProviderWrapperProps = {
  children: React$Node,
};

const AUTO_UPDATE_DEFAULT_DELAY = 1800 * 1000; // 1800 seconds

export function PlatformAppProviderWrapper({ children }: PlatformAppProviderWrapperProps) {
  const allowDebugApps = useSelector(allowDebugAppsSelector);
  const allowExperimentalApps = useSelector(allowExperimentalAppsSelector);
  const provider = useSelector(catalogProviderSelector);

  return (
    <RemoteLiveAppProvider
      provider={provider}
      branchesParams={{ allowDebugApps, allowExperimentalApps }}
      updateFrequency={AUTO_UPDATE_DEFAULT_DELAY}
    >
      <LocalLiveAppProvider>
        <GlobalCatalogProvider provider={provider} updateFrequency={AUTO_UPDATE_DEFAULT_DELAY}>
          <RampCatalogProvider provider={provider} updateFrequency={AUTO_UPDATE_DEFAULT_DELAY}>
            {children}
          </RampCatalogProvider>
        </GlobalCatalogProvider>
      </LocalLiveAppProvider>
    </RemoteLiveAppProvider>
  );
}
