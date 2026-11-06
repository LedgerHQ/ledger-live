import React from "react";
import { IconsLegacy } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import SettingsNavigationScrollView from "~/screens/Settings/SettingsNavigationScrollView";
import type { OsUpdatesDebugHubViewModel } from "./useOsUpdatesDebugHubViewModel";

export function OsUpdatesDebugHubView({
  onOpenGallery,
  onOpenLiveFlow,
}: Readonly<OsUpdatesDebugHubViewModel>) {
  return (
    <SettingsNavigationScrollView>
      <SettingsRow
        title="Screen gallery"
        desc="Every screen and sheet with fake data. No device needed"
        iconLeft={<IconsLegacy.EyeMedium size={24} color="black" />}
        onPress={onOpenGallery}
      />
      <SettingsRow
        title="Live flow"
        desc="Run the real update on a connected device"
        iconLeft={<IconsLegacy.NanoFirmwareUpdateMedium size={24} color="black" />}
        onPress={onOpenLiveFlow}
      />
    </SettingsNavigationScrollView>
  );
}
