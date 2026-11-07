// Fake launches for the analysis tests: A and B pairs, with the Debug value's start and the
// native start chosen per build.
import type { Sample, Side } from "../types.ts";

const PROCESS_START = 1_700_000_000_000;

export type LaunchOptions = Partial<Sample> & { jsStartOffset?: number; nativeStartMs?: number };

export function launch({
  side,
  appStartupTime,
  jsStartOffset = 5,
  nativeStartMs = 400,
  ...rest
}: LaunchOptions & { side: Side; appStartupTime: number }): Sample {
  return {
    platform: "android",
    scenario: "accounts",
    phase: 0,
    round: 0,
    side,
    device: "emulator-5554",
    warmup: false,
    startedAt: "2026-11-06T00:00:00.000Z",
    ok: true,
    appStartupTime,
    processStartAppClockAt: PROCESS_START,
    events: {
      "Before js imports": { count: 1, time: jsStartOffset },
      [`JS start epoch ${PROCESS_START + nativeStartMs}`]: { count: 1, time: jsStartOffset + 1 },
    },
    ...rest,
  };
}

// Phase 0 runs A on the first device and B on the second; phase 1 swaps them.
export function comparison({
  pairs = 6,
  deltaMs,
  secondDeviceSlowerByMs = 0,
  phases = [0, 1],
  a,
  b,
}: {
  pairs?: number;
  deltaMs: number;
  secondDeviceSlowerByMs?: number;
  phases?: number[];
  a?: LaunchOptions;
  b?: LaunchOptions;
}): Sample[] {
  const samples: Sample[] = [];
  for (const phase of phases) {
    for (let round = 0; round < pairs / 2; round++) {
      for (const side of ["A", "B"] as const) {
        const onSecondDevice = (side === "B") === (phase === 0);
        const value = 1000 + (side === "B" ? deltaMs : 0);
        samples.push(
          launch({
            side,
            phase,
            round,
            appStartupTime: value + (onSecondDevice ? secondDeviceSlowerByMs : 0),
            ...(side === "A" ? a : b),
          }),
        );
      }
    }
  }
  return samples;
}
