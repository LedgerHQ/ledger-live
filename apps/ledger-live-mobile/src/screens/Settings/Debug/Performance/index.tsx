import React from "react";
import { Text } from "@ledgerhq/native-ui";
import SettingsRow from "../../../../components/SettingsRow";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import { appStartupTime, appFirstRenderTime } from "../../../../startupTime";

export default function Performance() {
  return (
    <SettingsNavigationScrollView>
      <SettingsRow
        title={"App startup time"}
        desc={
          "Time from app startup to first javascript execution (flawed if app fast restarted in dev mode)"
        }
      >
        <Text variant={"body"} fontWeight={"medium"} color={"primary.c80"}>
          {appStartupTime} ms
        </Text>
      </SettingsRow>
      <SettingsRow
        title={"App first render time"}
        desc={"Time from first javascript execution to first react render"}
      >
        <Text variant={"body"} fontWeight={"medium"} color={"primary.c80"}>
          {appFirstRenderTime} ms
        </Text>
      </SettingsRow>
    </SettingsNavigationScrollView>
  );
}
