import React, { useEffect, useState } from "react";
import { Text } from "@ledgerhq/native-ui";
import { LAST_STARTUP_EVENT_VALUES } from "LLM/utils/logLastStartupEvents";
import { type GroupedStartupEvent, resolveStartupEvents } from "LLM/utils/resolveStartupEvents";
import SettingsRow from "~/components/SettingsRow";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";

export default function Performance() {
  const [startupEvents, setStartupEvents] = useState<GroupedStartupEvent[]>([]);
  const [startupTime, setStartupTime] = useState<number>();

  useEffect(() => {
    resolveStartupEvents().then(events => {
      setStartupTime(
        [...events].reverse().find(e => LAST_STARTUP_EVENT_VALUES.includes(e.event))?.time ?? 0,
      );
      setStartupEvents(events);
    });
  }, []);

  return (
    <SettingsNavigationScrollView>
      <SettingsRow
        title="App startup time"
        desc="Time from app startup to the beeing interactive to the user (does not include pre-js initialization time in dev mode)"
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
