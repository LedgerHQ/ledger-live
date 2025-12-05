import React, { useEffect, useState } from "react";
import { Text } from "@ledgerhq/native-ui";
import { resolveStartupEvents, type GroupedStartupEvent } from "LLM/utils/resolveStartupEvents";
import SettingsRow from "~/components/SettingsRow";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import { appStartupTime } from "../../../../StartupTimeMarker";

export default function Performance() {
  const [startupEvents, setStartupEvents] = useState<GroupedStartupEvent[]>([]);
  useEffect(() => {
    resolveStartupEvents().then(setStartupEvents);
  }, []);

  return (
    <SettingsNavigationScrollView>
      <SettingsRow
        title={"App startup time"}
        desc={
          "Time from app startup to first react render (flawed if app was reloaded in dev mode)"
        }
      >
        <Text variant={"body"} fontWeight={"medium"} color={"primary.c80"}>
          {appStartupTime} ms
        </Text>
      </SettingsRow>
      {startupEvents.map((event, index) => (
        <SettingsRow key={index} title={`${event.event} (x${event.count})`}>
          <Text variant={"body"} fontWeight={"medium"} color={"primary.c80"}>
            {event.time} ms
          </Text>
        </SettingsRow>
      ))}
    </SettingsNavigationScrollView>
  );
}
