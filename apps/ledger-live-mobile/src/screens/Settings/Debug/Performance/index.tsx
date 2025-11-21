import React, { useEffect, useState } from "react";
import { Text } from "@ledgerhq/native-ui";
import { startupEvents } from "LLM/hooks/useLogStartupEvent";
import SettingsRow from "~/components/SettingsRow";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import { appStartupTime } from "../../../../StartupTimeMarker";

type StartupEvent = Awaited<(typeof startupEvents)[0]>;

export default function Performance() {
  const [resolvedEvents, setResolvedEvents] = useState<StartupEvent[]>([]);
  useEffect(() => {
    Promise.all(startupEvents).then(resolvedEvents => {
      setResolvedEvents(resolvedEvents.sort((a, b) => a.time - b.time));
    });
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
      {resolvedEvents.map((event, index) => (
        <SettingsRow key={index} title={event.event}>
          <Text variant={"body"} fontWeight={"medium"} color={"primary.c80"}>
            {event.time} ms
          </Text>
        </SettingsRow>
      ))}
    </SettingsNavigationScrollView>
  );
}
