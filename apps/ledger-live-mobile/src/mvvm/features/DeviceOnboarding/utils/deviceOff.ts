import { ConnectionErrorTypes, DiscoveryErrorTypes } from "@ledgerhq/live-dmk-mobile";

const interactiveErrors = new Set<string>([
  ...Object.values(DiscoveryErrorTypes),
  ...Object.values(ConnectionErrorTypes),
]);

export function canRetryWithoutUser(error: string): boolean {
  return !interactiveErrors.has(error);
}

export function isDeviceOffDuringChecks({
  machineState,
  heldMachineState,
  onboardedOnEntry,
  hasLiveDevice,
}: Readonly<{
  machineState: string | null;
  heldMachineState: string | null;
  onboardedOnEntry: boolean | null;
  hasLiveDevice: boolean;
}>): boolean {
  return (
    machineState === "awaitingSession" &&
    heldMachineState?.startsWith("checks.") === true &&
    onboardedOnEntry !== false &&
    hasLiveDevice
  );
}
