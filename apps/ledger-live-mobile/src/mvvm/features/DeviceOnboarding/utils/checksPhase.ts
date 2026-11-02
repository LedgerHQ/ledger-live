import type { ChecksScreenState, GenuineErrorKind } from "LLM/features/DeviceOnboarding/types";

const genuineErrorKinds = {
  GENUINE_CHECK_REFUSED: "declined",
  DEVICE_NOT_GENUINE: "notGenuine",
  SECURE_CHANNEL_LOST: "network",
  GENUINE_CHECK_FAILED: "unknown",
} as const satisfies Record<string, GenuineErrorKind>;

export function toGenuineError(kind: string | null): { kind: GenuineErrorKind } | null {
  if (!kind || !(kind in genuineErrorKinds)) return null;
  return { kind: genuineErrorKinds[kind as keyof typeof genuineErrorKinds] };
}

export function toChecksError(
  machineState: string | null,
  genuineFailureKind: string | null,
): { kind: GenuineErrorKind } | null {
  if (machineState === "checks.firmwareCheckFailed") return { kind: "unknown" };
  if (machineState === "checks.genuineFailed" || machineState === "checks.notGenuineSupport") {
    return toGenuineError(genuineFailureKind);
  }
  return null;
}

const successExitStates = new Set(["syncOffer", "done"]);

export function toChecksScreenState(
  machineState: string | null,
  checksPaused: boolean,
  onboardedOnEntry = false,
): ChecksScreenState | null {
  if (machineState === "awaitingStart") return "idle";
  if (onboardedOnEntry && machineState !== null && successExitStates.has(machineState)) {
    return "succeeded";
  }
  if (!machineState?.startsWith("checks.")) return null;

  if (machineState === "checks.genuineCheck.awaitingApproval") return "awaitingAllow";
  if (machineState === "checks.firmwareUpdateOffered") return "updating";
  if (
    machineState === "checks.checksSucceeded" ||
    machineState === "checks.checksDone" ||
    machineState === "checks.leavingEarlyCheckScreen"
  ) {
    return "succeeded";
  }
  if (machineState === "checks.enteringEarlyCheckScreen") return "synchronizing";
  if (machineState === "checks.checksIdle" && checksPaused) return "idle";
  return "checking";
}

export function toFirmwareUpdate(
  current: string | null,
  available: string | null,
): { current: string; available: string } | null {
  if (!available) return null;
  return { current: current ?? "", available };
}
