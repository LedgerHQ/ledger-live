import React, { ReactNode } from "react";
import { RemoteLiveAppProvider } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LocalLiveAppProvider } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import { RampCatalogProvider } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { Platform } from "react-native";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { getEnv } from "@ledgerhq/live-env";
import { e2eBridgeSubject } from "../e2e/bridge/client";

type PlatformAppProviderWrapperProps = {
  children: ReactNode;
  localManifest?: LiveAppManifest;
};

const AUTO_UPDATE_DEFAULT_DELAY = 1800 * 1000; // 1800 seconds
const PLATFORM = Platform.OS === "ios" ? "ios" : "android";

export default function PlatformAppProviderWrapper({
  children,
}: PlatformAppProviderWrapperProps) {
  const isExperimentalAppEnabled = useEnv<"PLATFORM_EXPERIMENTAL_APPS">(
    "PLATFORM_EXPERIMENTAL_APPS",
  ) as boolean;

  const isDebugAppEnabled = useEnv<"PLATFORM_DEBUG">(
    "PLATFORM_DEBUG",
  ) as boolean;

  const mockEnabled = getEnv("MOCK") as boolean;

  console.log("mockEnabled");

  // There is no more staging since migration to manifest API. Everything points to prod by default.
  // const provider = __DEV__ ? "staging" : "production";
  const provider = "production";

  return (
    <RemoteLiveAppProvider
      updateFrequency={AUTO_UPDATE_DEFAULT_DELAY}
      parameters={{
        platform: PLATFORM,
        allowDebugApps: isDebugAppEnabled,
        allowExperimentalApps: isExperimentalAppEnabled,
      }}
    >
      <LocalLiveAppProvider
        mockModeObserver={mockEnabled ? e2eBridgeSubject : null}
      >
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
