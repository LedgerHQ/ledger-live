import React from "react";
import { IconsLegacy } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import Switch from "~/components/Switch";
import type { MockServerSettingsRowViewModel } from "./useMockServerSettingsRowViewModel";

export function MockServerSettingsRowView({
  isEnabled,
  isPending,
  onToggle,
  onOpenPanel,
}: MockServerSettingsRowViewModel) {
  return (
    <>
      <SettingsRow
        title="Mock server"
        desc="Replace physical devices with the devices of a mock server session. The app restarts."
        iconLeft={<IconsLegacy.ServerMedium size={32} color="black" />}
      >
        <Switch
          value={isEnabled}
          disabled={isPending}
          onValueChange={onToggle}
          testID="mock-server-toggle"
        />
      </SettingsRow>
      {isEnabled ? (
        <SettingsRow
          title="Open mock server panel"
          desc="Control the mocked devices and the session"
          iconLeft={<IconsLegacy.DevicesAltMedium size={32} color="black" />}
          onPress={onOpenPanel}
        />
      ) : null}
    </>
  );
}
