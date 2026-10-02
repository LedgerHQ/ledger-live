import type { MobileDiscoveryError } from "../../../types";
import type { AndroidPreflightRequirements } from "./androidPreflightRequirements";
import {
  buildLocationPermissionManualSettingsError,
  buildLocationPermissionPromptableError,
} from "../discoveryErrorBuilders";
import { runPermissionPreflight } from "./permissionHelpers";
import { type DiscoveryPreflightResult } from "../preflightResult";

/**
 * Checks the Android location permission required by BLE scanning on SDKs that still depend on it.
 *
 * When the current SDK has no location permission requirement, the check delegates an empty list to
 * the shared permission preflight helper so the chain can continue successfully.
 */
export class AndroidLocationPermissionPreflightCheck {
  constructor(private readonly retry: () => Promise<true | MobileDiscoveryError>) {}

  async run(requirements: AndroidPreflightRequirements): Promise<DiscoveryPreflightResult> {
    return runPermissionPreflight({
      permissions: requirements.locationPermission ? [requirements.locationPermission] : [],
      retry: this.retry,
      buildPromptableError: buildLocationPermissionPromptableError,
      buildManualSettingsError: buildLocationPermissionManualSettingsError,
    });
  }
}
