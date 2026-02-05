import React, { useEffect, useMemo, useState } from "react";
import { Text } from "@ledgerhq/native-ui";
import { getStorageSummary, type StorageSummary } from "LLM/storage/mmkvStorageWrapper/monitor";
import { LAST_STARTUP_EVENT_VALUES } from "LLM/utils/logLastStartupEvents";
import {
  getStartupTsp,
  type GroupedStartupEvent,
  resolveStartupEvents,
} from "LLM/utils/resolveStartupEvents";
import SettingsRow from "~/components/SettingsRow";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";

export default function Performance() {
  const [startupEvents, setStartupEvents] = useState<GroupedStartupEvent[]>([]);
  const [startupTime, setStartupTime] = useState<number>();
  const { time, read, write } = useStorageSummary();

  useEffect(() => {
    resolveStartupEvents().then(events => {
      setStartupTime(
        [...events].reverse().find(e => LAST_STARTUP_EVENT_VALUES.has(e.event))?.time ?? 0,
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
      <SettingsRow title="Time since start">
        <Text variant="body" fontWeight="medium" color="primary.c80">
          {time}
        </Text>
      </SettingsRow>
      <SettingsRow title="Reads from storage" desc="Total time spent reading">
        <Text variant="body" fontWeight="medium" color="primary.c80">
          {read.time} ({read.size})
        </Text>
      </SettingsRow>
      <SettingsRow title="Writes to storage" desc="Total time spent writing">
        <Text variant="body" fontWeight="medium" color="primary.c80">
          {write.time} ({write.size})
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

const STORAGE_POLL_INTERVAL = 1000;
function useStorageSummary() {
  const [summary, setSummary] = useState<StorageSummary>(getStorageSummary());

  useEffect(() => {
    const interval = setInterval(() => setSummary(getStorageSummary()), STORAGE_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    const start = getStartupTsp();
    const tsp = start ? Date.now() - start : 0;
    const time = new Date(tsp).toUTCString().split(" ")[4];
    return { ...summary, time };
  }, [summary]);
}
