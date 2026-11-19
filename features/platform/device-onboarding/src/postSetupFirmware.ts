import { currentVerdict } from "./internals/contextActions";
import type { DeviceOnboardingContext, FirmwareCheck } from "./types";

const postSetupFirmwarePrefix = "postSetupFirmware.";

/** The firmware check a Nano held back until it was seeded runs as the pre-setup one. */
export function asChecksState(machineState: string | null): string | null {
  if (!machineState?.startsWith(postSetupFirmwarePrefix)) return machineState;
  return `checks.${machineState.slice(postSetupFirmwarePrefix.length)}`;
}

export function isFirmwareCheckFailed(machineState: string | null): boolean {
  return asChecksState(machineState) === "checks.firmwareCheckFailed";
}

export function isFirmwareUpdateDelegated(machineState: string | null): boolean {
  return asChecksState(machineState) === "checks.firmwareUpdateDelegated";
}

type SetupDoneContext = Pick<DeviceOnboardingContext, "updateAfterSetup" | "isOnboarded">;

function isSetupDoneWithUpdateHeldBack(context: SetupDoneContext): boolean {
  return context.updateAfterSetup && context.isOnboarded;
}

const answeredFirmware = new Set<FirmwareCheck["kind"]>(["upToDate", "declined", "skipped"]);

/** The device is set up, and the update held back until then still waits for an answer. */
export function isHeldBackUpdatePending(
  context: SetupDoneContext & Pick<DeviceOnboardingContext, "firmware">,
): boolean {
  if (!isSetupDoneWithUpdateHeldBack(context)) return false;
  return context.firmware === null || !answeredFirmware.has(context.firmware.kind);
}

type QuitContext = SetupDoneContext & Pick<DeviceOnboardingContext, "sessionId" | "genuineVerdict">;

/** Leaving after setup finishes it instead of quitting it, once this session is genuine. */
export function finishesSetupOnQuit(context: QuitContext): boolean {
  return isSetupDoneWithUpdateHeldBack(context) && currentVerdict(context)?.isGenuine === true;
}
