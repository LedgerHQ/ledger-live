import React, { ReactNode } from "react";
import {
  allowDebugAppsSelector,
  allowExperimentalAppsSelector,
  catalogProviderSelector,
  languageSelector,
} from "~/renderer/reducers/settings";
import { useSelector } from "react-redux";
import { RemoteLiveAppProvider } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LocalLiveAppProvider } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import { RampCatalogProvider } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";

type PlatformAppProviderWrapperProps = {
  children: ReactNode;
};

const AUTO_UPDATE_DEFAULT_DELAY = 1800 * 1000; // 1800 seconds

export function PlatformAppProviderWrapper({ children }: PlatformAppProviderWrapperProps) {
  const allowDebugApps = useSelector(allowDebugAppsSelector);
  const allowExperimentalApps = useSelector(allowExperimentalAppsSelector);
  const provider = useSelector(catalogProviderSelector);
  const locale = useSelector(languageSelector);

  return (
    <RemoteLiveAppProvider
      parameters={{
        platform: "desktop",
        allowDebugApps,
        allowExperimentalApps,
        llVersion: __APP_VERSION__,
        lang: locale,
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
