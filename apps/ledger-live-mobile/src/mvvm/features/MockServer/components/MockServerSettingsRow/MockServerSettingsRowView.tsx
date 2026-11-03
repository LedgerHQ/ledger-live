import React from "react";
import { IconsLegacy } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import type { MockServerSettingsRowViewModel } from "./useMockServerSettingsRowViewModel";

export function MockServerSettingsRowView({ isEnabled, onPress }: MockServerSettingsRowViewModel) {
  return (
    <SettingsRow
      title="Mock server"
      desc={
        isEnabled
          ? "On. Manage the session and the mocked devices."
          : "Replace physical devices with the devices of a mock server session."
      }
      iconLeft={<IconsLegacy.ServerMedium size={32} color="black" />}
      onPress={onPress}
      arrowRight
    />
  );
}
