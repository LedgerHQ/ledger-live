import type { ChecksScreenState } from "LLM/features/DeviceOnboarding/types";
import { toChecksScreenState } from "./checksPhase";

export type FunnelPhase =
  | "connecting"
  | "failed"
  | "preparing"
  | "locked"
  | "leaving"
  | "setup"
  | "checks";

const topLevel = {
  readingState: "preparing",
  routing: "preparing",
  awaitingStart: "checks",
  deviceLocked: "locked",
  awaitingSession: "failed",
  awaitingSessionAfterFirmwareUpdate: "connecting",
  onboardedExit: "leaving",
  setupExit: "leaving",
  quitting: "leaving",
  leavingOnQuit: "leaving",
  legacyFallback: "leaving",
  bootloaderRecovery: "leaving",
  exitOnboarding: "leaving",
  syncOffer: "leaving",
  done: "leaving",
} as const satisfies Record<string, FunnelPhase>;

const synchronizingPhases = new Set<FunnelPhase>(["preparing", "locked", "leaving", "setup"]);

const seededSuccessExits = new Set(["syncOffer", "done"]);

export function phaseOf(machineState: string | null, onboardedOnEntry = false): FunnelPhase | null {
  if (machineState === null) return "connecting";
  if (machineState.startsWith("checks.")) return "checks";
  if (machineState.startsWith("deviceSetup.")) return "setup";
  if (onboardedOnEntry && seededSuccessExits.has(machineState)) return "checks";
  if (machineState in topLevel) return topLevel[machineState as keyof typeof topLevel];
  return null;
}

export function checksScreenForPhase(
  phase: FunnelPhase | null,
  machineState: string | null,
  checksPaused: boolean,
  onboardedOnEntry: boolean,
): ChecksScreenState | null {
  if (phase === "checks") {
    return toChecksScreenState(machineState, checksPaused, onboardedOnEntry) ?? "synchronizing";
  }
  if (phase !== null && synchronizingPhases.has(phase)) return "synchronizing";
  if (phase === null && machineState !== null) return "synchronizing";
  return null;
}
