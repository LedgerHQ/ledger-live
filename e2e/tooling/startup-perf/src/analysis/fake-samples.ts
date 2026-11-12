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
  const launchOf = (side: Side, phase: number, round: number) => {
    const onSecondDevice = (side === "B") === (phase === 0);
    const delta = side === "B" ? deltaMs : 0;
    const deviceBias = onSecondDevice ? secondDeviceSlowerByMs : 0;
    const options = side === "A" ? a : b;
    return launch({ side, phase, round, appStartupTime: 1000 + delta + deviceBias, ...options });
  };
  const rounds = Array.from({ length: Math.ceil(pairs / 2) }, (_, round) => round);
  return phases.flatMap(phase =>
    rounds.flatMap(round => [launchOf("A", phase, round), launchOf("B", phase, round)]),
  );
}

/**
 * A counts from the first JS import, B from the process start, 800 ms earlier, and one B launch
 * fell back to the first JS import (the app found no process start). Both builds are as fast.
 */
export function startsDifferWithFallback(): Sample[] {
  const samples = comparison({
    deltaMs: 0,
    a: { jsStartOffset: 0, nativeStartMs: 800 },
    b: { jsStartOffset: 800, nativeStartMs: 800, appStartupTime: 1800 },
  });
  const fallback = samples.find(s => s.side === "B");
  if (!fallback?.events) throw new Error("no B launch");
  fallback.appStartupTime = 1000;
  fallback.events["Before js imports"].time = 0;
  return samples;
}
