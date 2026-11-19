import { currentVerdict } from "./internals/contextActions";
import type { DeviceOnboardingContext } from "./types";

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

type HeldBackUpdateContext = Pick<DeviceOnboardingContext, "updateAfterSetup" | "isOnboarded">;

/** The device is set up, and only the update held back until then is left. */
export function isHeldBackUpdatePending(context: HeldBackUpdateContext): boolean {
  return context.updateAfterSetup && context.isOnboarded;
}

type QuitContext = HeldBackUpdateContext &
  Pick<DeviceOnboardingContext, "sessionId" | "genuineVerdict">;

/** Leaving then finishes the setup instead of quitting it, once this session is genuine. */
export function finishesSetupOnQuit(context: QuitContext): boolean {
  return isHeldBackUpdatePending(context) && currentVerdict(context)?.isGenuine === true;
}
