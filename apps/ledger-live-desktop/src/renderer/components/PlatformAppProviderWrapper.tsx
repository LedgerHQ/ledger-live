import React, { ReactNode } from "react";
import {
  allowDebugAppsSelector,
  allowExperimentalAppsSelector,
  catalogProviderSelector,
  languageSelector,
} from "~/renderer/reducers/settings";
import { useSelector } from "react-redux";
import { RemoteLiveAppProvider } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LocalLiveAppProvider } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { RampCatalogProvider } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import { useDB } from "../storage";
import {
  DISCOVER_STORE_KEY,
  INITIAL_PLATFORM_STATE,
} from "@ledgerhq/live-common/wallet-api/constants";

type PlatformAppProviderWrapperProps = {
  children: ReactNode;
};

const AUTO_UPDATE_DEFAULT_DELAY = 1800 * 1000; // 1800 seconds

export function PlatformAppProviderWrapper({ children }: PlatformAppProviderWrapperProps) {
  const allowDebugApps = useSelector(allowDebugAppsSelector);
  const allowExperimentalApps = useSelector(allowExperimentalAppsSelector);
  const provider = useSelector(catalogProviderSelector);
  const locale = useSelector(languageSelector);
  const localLiveAppDB = useLocalLiveAppDB();

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
      <LocalLiveAppProvider db={localLiveAppDB}>
        <RampCatalogProvider provider={provider} updateFrequency={AUTO_UPDATE_DEFAULT_DELAY}>
          {children}
        </RampCatalogProvider>
      </LocalLiveAppProvider>
    </RemoteLiveAppProvider>
  );
}

function useLocalLiveAppDB() {
  return useDB("app", DISCOVER_STORE_KEY, INITIAL_PLATFORM_STATE, state => state.localLiveApp);
}
