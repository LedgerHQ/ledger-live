import type { DiscoveryError } from "../../../types";
import type { AndroidPreflightRequirements } from "./androidPreflightRequirements";
import {
  buildBluetoothPermissionManualSettingsError,
  buildBluetoothPermissionPromptableError,
} from "../discoveryErrorBuilders";
import { runPermissionPreflight } from "./permissionHelpers";
import { type DiscoveryPreflightResult } from "../preflightResult";

/**
 * Checks the Android Bluetooth runtime permissions required before BLE discovery can start.
 *
 * The requirements object provides the SDK-specific permission list, and missing permissions are
 * requested through the shared permission preflight helper.
 */
export class AndroidBluetoothPermissionPreflightCheck {
  constructor(private readonly retry: () => Promise<true | DiscoveryError>) {}

  async run(requirements: AndroidPreflightRequirements): Promise<DiscoveryPreflightResult> {
    return runPermissionPreflight({
      permissions: requirements.bluetoothPermissions,
      retry: this.retry,
      buildPromptableError: buildBluetoothPermissionPromptableError,
      buildManualSettingsError: buildBluetoothPermissionManualSettingsError,
    });
  }
}
