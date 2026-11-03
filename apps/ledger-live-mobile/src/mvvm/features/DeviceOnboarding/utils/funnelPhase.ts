import type { ChecksScreenState } from "LLM/features/DeviceOnboarding/types";
import { toChecksScreenState } from "./checksPhase";

export type FunnelPhase = "connecting" | "failed" | "checks" | "synchronizing";

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

export function phaseOf(machineState: string | null, onboardedOnEntry = false): FunnelPhase | null {
  if (machineState === null) return "connecting";
  if (machineState.startsWith("checks.")) return "checks";
  if (machineState.startsWith("deviceSetup.")) return "synchronizing";
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
  if (phase === "connecting" || phase === "failed") return null;
  if (phase === "checks") {
    return toChecksScreenState(machineState, checksPaused, onboardedOnEntry) ?? "synchronizing";
  }
  return "synchronizing";
}
