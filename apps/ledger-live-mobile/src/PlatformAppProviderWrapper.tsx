import React, { ReactNode } from "react";
import { RemoteLiveAppProvider } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LocalLiveAppProvider } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import { RampCatalogProvider } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { getPlatformVersion } from "@ledgerhq/live-common/platform/version";

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

  const isDebugAppEnabled = useEnv<"PLATFORM_DEBUG">(
    "PLATFORM_DEBUG",
  ) as boolean;

  const provider = __DEV__ ? "staging" : "production";

  return (
    <RemoteLiveAppProvider
      updateFrequency={AUTO_UPDATE_DEFAULT_DELAY}
      parameters={{
        version: getPlatformVersion(),
        platform: "mobile",
        private: false,
        allowDebugApps: isDebugAppEnabled,
        allowExperimentalApps: isExperimentalAppEnabled,
      }}
    >
      <LocalLiveAppProvider>
        <RampCatalogProvider
          provider={provider}
          updateFrequency={AUTO_UPDATE_DEFAULT_DELAY}
        >
          {children}
        </RampCatalogProvider>
      </LocalLiveAppProvider>
    </RemoteLiveAppProvider>
  );
}
