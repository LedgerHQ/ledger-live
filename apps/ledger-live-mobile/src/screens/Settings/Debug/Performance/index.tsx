import React, { useCallback, useEffect, useState } from "react";
import { Text } from "@ledgerhq/native-ui";
import { LAST_STARTUP_EVENT_VALUES } from "LLM/utils/logLastStartupEvents";
import { type GroupedStartupEvent, resolveStartupEvents } from "LLM/utils/resolveStartupEvents";
import {
  getPerfOptimizationMode,
  setPerfOptimizationMode,
  type PerfOptimizationMode,
} from "LLM/utils/perfOptimizationMode";
import {
  benchRankAccounts,
  makeHeavyAccountSnapshots,
  type RankAccountsBench,
} from "LLM/utils/rankAccountsWorklet";
import SettingsRow from "~/components/SettingsRow";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";

const BENCH_PARENTS = 400;
const BENCH_TOKENS_PER_PARENT = 30;
const BENCH_REPEATS = 8;

const MODE_ROWS: { mode: PerfOptimizationMode; title: string; desc: string }[] = [
  {
    mode: "full",
    title: "Mode: full",
    desc: "getComponent + worklet. Relaunch after switching.",
  },
  {
    mode: "getcomponent",
    title: "Mode: getComponent only",
    desc: "getComponent on, ranking on JS. Relaunch after switching.",
  },
  {
    mode: "none",
    title: "Mode: none",
    desc: "Eager screens + JS ranking. Relaunch after switching.",
  },
];

function formatMs(value: number): string {
  return `${value.toFixed(1)} ms`;
}

export default function Performance() {
  const [mode, setMode] = useState<PerfOptimizationMode>(getPerfOptimizationMode);
  const [startupEvents, setStartupEvents] = useState<GroupedStartupEvent[]>([]);
  const [startupTime, setStartupTime] = useState<number>();
  const [bench, setBench] = useState<RankAccountsBench | null>(null);
  const [benchRunning, setBenchRunning] = useState(false);

  useEffect(() => {
    resolveStartupEvents().then(events => {
      const lastEvents = new Set<string>(LAST_STARTUP_EVENT_VALUES);
      setStartupTime([...events].reverse().find(e => lastEvents.has(e.event))?.time ?? 0);
      setStartupEvents(events);
    });
  }, []);

  const selectMode = useCallback((next: PerfOptimizationMode) => {
    setPerfOptimizationMode(next);
    setMode(next);
  }, []);

  const runAccountWorkletBench = useCallback(async () => {
    setBenchRunning(true);
    setBench(null);
    try {
      const snapshots = makeHeavyAccountSnapshots(BENCH_PARENTS, BENCH_TOKENS_PER_PARENT);
      const excludedTokenIds = Array.from({ length: 17 }, (_, index) => `blocked-${index}`);
      const result = await benchRankAccounts({ snapshots, excludedTokenIds }, BENCH_REPEATS);
      setBench(result);
      console.warn(
        `[perf-bench] mode=${getPerfOptimizationMode()} startupMs=${startupTime ?? "n/a"} items=${result.itemCount} jsBlocked=${result.jsThreadMs.toFixed(1)}ms workletWall=${result.workletWallMs.toFixed(1)}ms jsFree=${result.jsThreadFreeMs.toFixed(1)}ms`,
      );
    } finally {
      setBenchRunning(false);
    }
  }, [startupTime]);

  return (
    <SettingsNavigationScrollView>
      <SettingsRow
        title="App startup time"
        desc="Headline is splash / App started. First paint is Home layout (Portfolio or Welcome). Dev mode excludes pre-js init."
        testID="perf-startup-time"
      >
        <Text variant="body" fontWeight="medium" color="primary.c80">
          {startupTime} ms
        </Text>
      </SettingsRow>
      {MODE_ROWS.map(row => (
        <SettingsRow
          key={row.mode}
          title={row.title}
          desc={row.desc}
          selected={mode === row.mode}
          onPress={() => selectMode(row.mode)}
          testID={`perf-mode-${row.mode}`}
        >
          <Text variant="body" fontWeight="medium" color="primary.c80">
            {mode === row.mode ? "ON" : "off"}
          </Text>
        </SettingsRow>
      ))}
      <SettingsRow
        title={benchRunning ? "Running account ranking bench…" : "Bench account ranking"}
        desc={`${BENCH_PARENTS} parents × ${BENCH_TOKENS_PER_PARENT} tokens × ${BENCH_REPEATS} passes.`}
        onPress={benchRunning ? undefined : runAccountWorkletBench}
        testID="perf-run-bench"
      >
        <Text variant="body" fontWeight="medium" color="primary.c80">
          {benchRunning ? "…" : "Run"}
        </Text>
      </SettingsRow>
      {bench ? (
        <>
          <SettingsRow title="Items ranked" desc="Flattened parents + tokens" testID="perf-items">
            <Text variant="body" fontWeight="medium" color="primary.c80">
              {bench.itemCount}
            </Text>
          </SettingsRow>
          <SettingsRow
            title="JS thread blocked"
            desc="Same ranking on the React JS thread"
            testID="perf-js-blocked"
          >
            <Text variant="body" fontWeight="medium" color="primary.c80">
              {formatMs(bench.jsThreadMs)}
            </Text>
          </SettingsRow>
          <SettingsRow
            title="Worklet wall time"
            desc="Background runtime, including scheduling"
            testID="perf-worklet-wall"
          >
            <Text variant="body" fontWeight="medium" color="primary.c80">
              {formatMs(bench.workletWallMs)}
            </Text>
          </SettingsRow>
          <SettingsRow
            title="JS thread stayed free"
            desc="How soon JS handled setTimeout(0) while ranking ran."
            testID="perf-js-free"
          >
            <Text variant="body" fontWeight="medium" color="primary.c80">
              {formatMs(bench.jsThreadFreeMs)}
            </Text>
          </SettingsRow>
        </>
      ) : null}
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
