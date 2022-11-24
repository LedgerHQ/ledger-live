import React, { ReactNode } from "react";
import { RemoteLiveAppProvider } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LocalLiveAppProvider } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import { GlobalCatalogProvider } from "@ledgerhq/live-common/platform/providers/GlobalCatalogProvider/index";
import { RampCatalogProvider } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";

type PlatformAppProviderWrapperProps = {
  children: ReactNode;
};

const AUTO_UPDATE_DEFAULT_DELAY = 1800 * 1000; // 1800 seconds

export default function PlatformAppProviderWrapper({
  children,
}: PlatformAppProviderWrapperProps) {
  const isExperimentalAppEnabled = useEnv<"PLATFORM_EXPERIMENTAL_APPS">(
    "PLATFORM_EXPERIMENTAL_APPS",
  ) as boolean;
  const provider = __DEV__ ? "staging" : "production";

  return (
    <RemoteLiveAppProvider
      provider={provider}
      updateFrequency={AUTO_UPDATE_DEFAULT_DELAY}
      branchesParams={{
        allowDebugApps: false,
        allowExperimentalApps: isExperimentalAppEnabled,
      }}
    >
      <LocalLiveAppProvider>
        <GlobalCatalogProvider
          provider={provider}
          updateFrequency={AUTO_UPDATE_DEFAULT_DELAY}
        >
          <RampCatalogProvider
            provider={provider}
            updateFrequency={AUTO_UPDATE_DEFAULT_DELAY}
          >
            {children}
          </RampCatalogProvider>
        </GlobalCatalogProvider>
      </LocalLiveAppProvider>
    </RemoteLiveAppProvider>
  );
}
