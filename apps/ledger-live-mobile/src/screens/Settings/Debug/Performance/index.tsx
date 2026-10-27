import React, { useState } from "react";
import { Text } from "@ledgerhq/native-ui";
import { LAST_STARTUP_EVENT_VALUES } from "LLM/utils/logLastStartupEvents";
import { resolveStartupEvents } from "LLM/utils/resolveStartupEvents";
import SettingsRow from "~/components/SettingsRow";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";

const LAST_EVENTS = new Set<string>(LAST_STARTUP_EVENT_VALUES);

export default function Performance() {
  const [startupEvents] = useState(resolveStartupEvents);
  const startupTime = [...startupEvents].reverse().find(e => LAST_EVENTS.has(e.event))?.time ?? 0;

  return (
    <SettingsNavigationScrollView>
      <SettingsRow
        title="App startup time"
        desc="Time from the JS start to being interactive to the user (does not include the native initialization time)"
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
