import type { MobileDiscoveryError } from "../../../types";
import type { AndroidPreflightRequirements } from "./androidPreflightRequirements";
import {
  buildLocationDisabledManualActionError,
  buildLocationDisabledPromptableError,
  buildLocationServicePermissionMissingError,
  buildUnknownDiscoveryError,
} from "../discoveryErrorBuilders";
import { getLocationHelperModule, type LocationServiceResponse } from "../nativeModules";
import {
  mapDiscoveryErrorToPreflightResult,
  successPreflightResult,
  type DiscoveryPreflightResult,
} from "../preflightResult";

/**
 * Checks whether Android location services are enabled when the current SDK requires them for BLE.
 *
 * The native helper may enable location services, report a user denial, or surface permission and
 * activity errors that are mapped into discovery preflight failures.
 */
export class AndroidLocationServicePreflightCheck {
  constructor(
    private readonly retry: () => Promise<true | MobileDiscoveryError>,
    private readonly getLocationHelper = getLocationHelperModule,
  ) {}

  async run(_requirements: AndroidPreflightRequirements): Promise<DiscoveryPreflightResult> {
    const locationHelperModule = this.getLocationHelper();

    if (!locationHelperModule?.checkAndRequestEnablingLocationServices) {
      return mapDiscoveryErrorToPreflightResult(this.buildLocationDisabledManualActionError());
    }

    try {
      const response = await locationHelperModule.checkAndRequestEnablingLocationServices();

      return this.resultFromLocationServiceResponse(response);
    } catch (error) {
      return mapDiscoveryErrorToPreflightResult(buildUnknownDiscoveryError(error, this.retry));
    }
  }

  private resultFromLocationServiceResponse(
    response: LocationServiceResponse,
  ): DiscoveryPreflightResult {
    switch (response) {
      case "SUCCESS_LOCATION_ALREADY_ENABLED":
      case "SUCCESS_LOCATION_ENABLED":
        return successPreflightResult;
      case "ERROR_USER_DENIED_LOCATION":
        return mapDiscoveryErrorToPreflightResult(buildLocationDisabledPromptableError(this.retry));
      case "ERROR_LOCATION_PERMISSIONS_NEEDED":
        return mapDiscoveryErrorToPreflightResult(
          buildLocationServicePermissionMissingError(this.retry),
        );
      case "ERROR_ACTIVITY_DOES_NOT_EXIST":
      case "ERROR_UNKNOWN":
        return mapDiscoveryErrorToPreflightResult(
          this.buildLocationDisabledManualActionError(response),
        );
    }
  }

  private buildLocationDisabledManualActionError(error?: unknown) {
    return buildLocationDisabledManualActionError(this.retry, error);
  }
}
