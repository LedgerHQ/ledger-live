import React, { useState } from "react";
import { Text } from "@ledgerhq/native-ui";
import { LAST_STARTUP_EVENT_VALUES } from "LLM/utils/logLastStartupEvents";
import {
  getStartupTimeBase,
  resolveStartupEvents,
  type StartupTimeBase,
} from "LLM/utils/resolveStartupEvents";
import SettingsRow from "~/components/SettingsRow";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";

const LAST_EVENTS = new Set<string>(LAST_STARTUP_EVENT_VALUES);

const STARTUP_TIME_DESCRIPTIONS: Record<StartupTimeBase, string> = {
  process: "Time from the app process start to being interactive to the user",
  js: "Time from the JS start to being interactive to the user (the native initialization time is not available)",
};

const DEV_STARTUP_TIME_DESCRIPTION =
  "Time from the JS start to being interactive to the user (dev builds leave out the native initialization time)";

export default function Performance() {
  const [startupEvents] = useState(resolveStartupEvents);
  const [startupTimeBase] = useState(getStartupTimeBase);
  const startupTime = [...startupEvents].reverse().find(e => LAST_EVENTS.has(e.event))?.time ?? 0;
  const startupTimeDescription = __DEV__
    ? DEV_STARTUP_TIME_DESCRIPTION
    : STARTUP_TIME_DESCRIPTIONS[startupTimeBase];

  return (
    <SettingsNavigationScrollView>
      <SettingsRow title="App startup time" desc={startupTimeDescription}>
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
