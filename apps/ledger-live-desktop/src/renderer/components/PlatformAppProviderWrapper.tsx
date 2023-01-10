import React, { ReactNode } from "react";
import {
  allowDebugAppsSelector,
  allowExperimentalAppsSelector,
} from "~/renderer/reducers/settings";
import { useSelector } from "react-redux";
import { RemoteLiveAppProvider } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LocalLiveAppProvider } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import { RampCatalogProvider } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import { getPlatformVersion } from "@ledgerhq/live-common/platform/version";
import { catalogProviderSelector } from "~/renderer/reducers/settings";

type PlatformAppProviderWrapperProps = {
  children: ReactNode;
};

const AUTO_UPDATE_DEFAULT_DELAY = 1800 * 1000; // 1800 seconds

export function PlatformAppProviderWrapper({ children }: PlatformAppProviderWrapperProps) {
  const allowDebugApps = useSelector(allowDebugAppsSelector);
  const allowExperimentalApps = useSelector(allowExperimentalAppsSelector);
  const provider = useSelector(catalogProviderSelector);

  return (
    <RemoteLiveAppProvider
      parameters={{
        version: getPlatformVersion(),
        platform: "desktop",
        allowDebugApps,
        allowExperimentalApps,
      }}
      updateFrequency={AUTO_UPDATE_DEFAULT_DELAY}
    >
      <LocalLiveAppProvider>
        <RampCatalogProvider provider={provider} updateFrequency={AUTO_UPDATE_DEFAULT_DELAY}>
          {children}
        </RampCatalogProvider>
      </LocalLiveAppProvider>
    </RemoteLiveAppProvider>
  );
}
