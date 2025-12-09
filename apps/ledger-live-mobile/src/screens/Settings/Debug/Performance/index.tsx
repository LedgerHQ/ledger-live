import React, { useEffect, useState } from "react";
import { Text } from "@ledgerhq/native-ui";
import {
  type GroupedStartupEvent,
  resolveStartupEvents,
  STARTUP_EVENTS,
} from "LLM/utils/resolveStartupEvents";
import SettingsRow from "~/components/SettingsRow";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";

export default function Performance() {
  const [startupEvents, setStartupEvents] = useState<GroupedStartupEvent[]>([]);
  const [startupTime, setStartupTime] = useState<number>();
  useEffect(() => {
    resolveStartupEvents().then(events => {
      setStartupEvents(events);
      setStartupTime(events.find(({ event }) => event === STARTUP_EVENTS.STARTED)?.time);
    });
  }, []);

  return (
    <SettingsNavigationScrollView>
      <SettingsRow
        title="App startup time"
        desc="Time from app startup to first react render (flawed if app was reloaded in dev mode)"
      >
        <Text variant="body" fontWeight="medium" color="primary.c80">
          {startupTime} ms
        </Text>
      </SettingsRow>
      {startupEvents.map(({ event, time, count }) => (
        <SettingsRow key={event} title={`${event} (x${count})`}>
          <Text variant="body" fontWeight="medium" color="primary.c80">
            {time} ms
          </Text>
        </SettingsRow>
      ))}
    </SettingsNavigationScrollView>
  );
}
