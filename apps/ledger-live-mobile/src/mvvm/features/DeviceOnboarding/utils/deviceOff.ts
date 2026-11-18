import { ConnectionErrorTypes, DiscoveryErrorTypes } from "@ledgerhq/live-dmk-mobile";
import { isResumingChecksState } from "./funnelPhase";

const interactiveErrors = new Set<string>([
  ...Object.values(DiscoveryErrorTypes),
  ...Object.values(ConnectionErrorTypes),
]);

export const powerOnAfterUpdateDelayMs = 20_000;

export function canRetryWithoutUser(error: string): boolean {
  return !interactiveErrors.has(error);
}

export function isDeviceOffDuringChecks({
  machineState,
  heldMachineState,
  onboardedOnEntry,
  hasLiveDevice,
  returningFromFirmwareUpdate,
}: Readonly<{
  machineState: string | null;
  heldMachineState: string | null;
  onboardedOnEntry: boolean | null;
  hasLiveDevice: boolean;
  returningFromFirmwareUpdate: boolean;
}>): boolean {
  const holdsChecks =
    heldMachineState?.startsWith("checks.") === true ||
    (returningFromFirmwareUpdate &&
      onboardedOnEntry === true &&
      heldMachineState !== null &&
      isResumingChecksState(heldMachineState));
  return (
    machineState === "awaitingSession" && holdsChecks && onboardedOnEntry !== false && hasLiveDevice
  );
}
