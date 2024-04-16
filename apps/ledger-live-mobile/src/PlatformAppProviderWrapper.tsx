import React, { ReactNode } from "react";
import VersionNumber from "react-native-version-number";
import { RemoteLiveAppProvider } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LocalLiveAppProvider } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import { RampCatalogProvider } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { Platform } from "react-native";
import { useLocale } from "./context/Locale";

type PlatformAppProviderWrapperProps = {
  children: ReactNode;
};

const AUTO_UPDATE_DEFAULT_DELAY = 1800 * 1000; // 1800 seconds
const PLATFORM = Platform.OS === "ios" ? "ios" : "android";

export default function PlatformAppProviderWrapper({ children }: PlatformAppProviderWrapperProps) {
  const isExperimentalAppEnabled = useEnv<"PLATFORM_EXPERIMENTAL_APPS">(
    "PLATFORM_EXPERIMENTAL_APPS",
  ) as boolean;
  const { locale: lang } = useLocale();
  const isDebugAppEnabled = useEnv<"PLATFORM_DEBUG">("PLATFORM_DEBUG") as boolean;

  return (
    <RemoteLiveAppProvider
      updateFrequency={AUTO_UPDATE_DEFAULT_DELAY}
      parameters={{
        platform: PLATFORM,
        allowDebugApps: isDebugAppEnabled,
        allowExperimentalApps: isExperimentalAppEnabled,
        llVersion: VersionNumber.appVersion,
        lang,
      }}
    >
      <LocalLiveAppProvider>
        <RampCatalogProvider updateFrequency={AUTO_UPDATE_DEFAULT_DELAY}>
          {children}
        </RampCatalogProvider>
      </LocalLiveAppProvider>
    </RemoteLiveAppProvider>
  );
}
