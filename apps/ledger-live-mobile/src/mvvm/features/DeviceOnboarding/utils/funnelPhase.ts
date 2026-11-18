import type { ChecksScreenState } from "LLM/features/DeviceOnboarding/types";
import { toChecksScreenState } from "./checksPhase";

export type FunnelPhase = "connecting" | "failed" | "checks" | "resumingChecks" | "synchronizing";

const topLevel = {
  readingState: "synchronizing",
  routing: "synchronizing",
  awaitingStart: "checks",
  deviceLocked: "synchronizing",
  awaitingSession: "failed",
  awaitingSessionAfterFirmwareUpdate: "connecting",
  onboardedExit: "synchronizing",
  setupExit: "synchronizing",
  quitting: "synchronizing",
  leavingOnQuit: "synchronizing",
  legacyFallback: "synchronizing",
  bootloaderRecovery: "synchronizing",
  exitOnboarding: "synchronizing",
  syncOffer: "synchronizing",
  done: "synchronizing",
} as const satisfies Record<string, FunnelPhase>;

const seededSuccessExits = new Set(["syncOffer", "done"]);

const statesBeforeChecksResume = new Set([
  "awaitingSessionAfterFirmwareUpdate",
  "readingState",
  "routing",
]);

export function isResumingChecksState(machineState: string): boolean {
  return statesBeforeChecksResume.has(machineState);
}

export function phaseOf(
  machineState: string | null,
  onboardedOnEntry: boolean | null = null,
  returningFromFirmwareUpdate = false,
): FunnelPhase | null {
  if (machineState === null) return "connecting";
  if (
    returningFromFirmwareUpdate &&
    onboardedOnEntry === true &&
    isResumingChecksState(machineState)
  ) {
    return "resumingChecks";
  }
  if (machineState.startsWith("checks.")) return "checks";
  if (machineState.startsWith("deviceSetup.")) return "synchronizing";
  if (onboardedOnEntry === true && seededSuccessExits.has(machineState)) return "checks";
  if (onboardedOnEntry === false && machineState === "done") return "checks";
  if (machineState in topLevel) return topLevel[machineState as keyof typeof topLevel];
  return null;
}

export function checksScreenForPhase(
  phase: FunnelPhase | null,
  machineState: string | null,
  checksPaused: boolean,
  onboardedOnEntry: boolean,
): ChecksScreenState | null {
  if (phase === "connecting" || phase === "failed") return null;
  if (phase === "resumingChecks") return "checking";
  if (phase === "checks") {
    return toChecksScreenState(machineState, checksPaused, onboardedOnEntry) ?? "synchronizing";
  }
  return "synchronizing";
}
