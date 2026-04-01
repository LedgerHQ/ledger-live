import React from "react";
import { Text, Flex } from "@ledgerhq/native-ui";
import { type Observable, interval, concat } from "rxjs";
import { map, take } from "rxjs/operators";
import type { IntentPlatformDefinition } from "@ledgerhq/device-intent";

export type TimerJobState = { type: "tick"; count: number; total: number };

export type TimerInput = { tickCount: number };

export type TimerExtraProps = Record<string, never>;

const TimerDemoIntentComponent: React.FC<{
  jobState: TimerJobState | undefined;
  extraProps: TimerExtraProps;
}> = ({ jobState }) => (
  <Flex p={4}>
    <Text variant="body">
      Timer intent —{" "}
      {jobState?.type === "tick" ? `tick ${jobState.count}/${jobState.total}` : "starting…"}
    </Text>
  </Flex>
);

export type TimerDemoIntentDef = IntentPlatformDefinition<TimerJobState, TimerInput, TimerExtraProps>;

/**
 * Simplest possible intent: emits N ticks at 1 s intervals then completes.
 * Demonstrates a basic observable job with configurable input and no device
 * interaction beyond the initial connection.
 */
export const timerDemoIntentDef: TimerDemoIntentDef = {
  label: "Timer",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: ({ input }): Observable<TimerJobState> =>
    concat(
      interval(1000).pipe(
        take(input.tickCount),
        map(i => ({ type: "tick" as const, count: i + 1, total: input.tickCount })),
      ),
    ),
  component: TimerDemoIntentComponent,
};
