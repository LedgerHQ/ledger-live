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

const postSetupFirmwarePrefix = "postSetupFirmware.";

export const firmwareUpdateDelegatedState = "checks.firmwareUpdateDelegated";

/** The firmware check a Nano held back until it was seeded shows as the pre-setup one. */
export function asChecksState(machineState: string | null): string | null {
  if (!machineState?.startsWith(postSetupFirmwarePrefix)) return machineState;
  return `checks.${machineState.slice(postSetupFirmwarePrefix.length)}`;
}

export function isPostSetupFirmware(machineState: string | null): boolean {
  return machineState?.startsWith(postSetupFirmwarePrefix) === true;
}

export function isFirmwareUpdateDelegated(machineState: string | null): boolean {
  return asChecksState(machineState) === firmwareUpdateDelegatedState;
}

export function toChecksError(
  rawMachineState: string | null,
  genuineFailureKind: string | null,
): { kind: GenuineErrorKind } | null {
  const machineState = asChecksState(rawMachineState);
  if (machineState === "checks.firmwareCheckFailed") return { kind: "unknown" };
  if (machineState === "checks.genuineFailed" || machineState === "checks.notGenuineSupport") {
    return toGenuineError(genuineFailureKind);
  }
  return null;
}

const successExitStates = new Set(["syncOffer", "done"]);

export function toChecksScreenState(
  rawMachineState: string | null,
  checksPaused: boolean,
  onboardedOnEntry: boolean | null = null,
): ChecksScreenState | null {
  const machineState = asChecksState(rawMachineState);
  if (machineState === "awaitingStart") return "idle";
  if (machineState === "done" && onboardedOnEntry === false) return "succeeded";
  if (onboardedOnEntry === true && machineState !== null && successExitStates.has(machineState)) {
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
