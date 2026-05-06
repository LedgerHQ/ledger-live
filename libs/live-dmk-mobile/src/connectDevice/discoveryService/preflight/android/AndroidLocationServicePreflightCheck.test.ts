import type { DiscoveryError } from "../../../types";
import { DiscoveryErrors } from "../../../types";
import { AndroidLocationServicePreflightCheck } from "./AndroidLocationServicePreflightCheck";
import type { AndroidPreflightRequirements } from "./androidPreflightRequirements";
import type { LocationHelperModule, LocationServiceResponse } from "../nativeModules";
import type { DiscoveryPreflightResult } from "../preflightResult";

const retry = jest.fn<Promise<true | DiscoveryError>, []>();

describe("AndroidLocationServicePreflightCheck", () => {
  beforeEach(() => {
    retry.mockReset();
  });

  it("GIVEN no location helper exists, WHEN running preflight, THEN it should require manual action", async () => {
    // GIVEN
    const check = new AndroidLocationServicePreflightCheck(retry, () => undefined);

    // WHEN
    const result = await check.run(makeRequirements());

    // THEN
    expect(getError(result)).toMatchObject({
      type: DiscoveryErrors.LocationDisabledManualAction,
      resolution: { type: "manual-action", retry },
    });
  });

  it.each<LocationServiceResponse>([
    "SUCCESS_LOCATION_ALREADY_ENABLED",
    "SUCCESS_LOCATION_ENABLED",
  ])(
    "GIVEN native location service response %s, WHEN running preflight, THEN it should succeed",
    async response => {
      // GIVEN
      const { check } = makeCheck(response);

      // WHEN
      const result = await check.run(makeRequirements());

      // THEN
      expect(result).toEqual({ success: true });
    },
  );

  it("GIVEN the user denies the native location prompt, WHEN running preflight, THEN it should return a promptable location disabled error", async () => {
    // GIVEN
    const { check } = makeCheck("ERROR_USER_DENIED_LOCATION");

    // WHEN
    const result = await check.run(makeRequirements());

    // THEN
    expect(getError(result)).toMatchObject({
      type: DiscoveryErrors.LocationDisabledPromptable,
      resolution: { type: "prompt", retry },
    });
  });

  it("GIVEN native location service needs permission, WHEN running preflight, THEN it should return a permission missing error", async () => {
    // GIVEN
    const { check } = makeCheck("ERROR_LOCATION_PERMISSIONS_NEEDED");

    // WHEN
    const result = await check.run(makeRequirements());

    // THEN
    expect(getError(result)).toMatchObject({
      type: DiscoveryErrors.LocationServicePermissionMissing,
      resolution: { type: "check-only", retry },
    });
  });

  it.each<LocationServiceResponse>(["ERROR_ACTIVITY_DOES_NOT_EXIST", "ERROR_UNKNOWN"])(
    "GIVEN native location service response %s, WHEN running preflight, THEN it should require manual action",
    async response => {
      // GIVEN
      const { check } = makeCheck(response);

      // WHEN
      const result = await check.run(makeRequirements());

      // THEN
      expect(getError(result)).toMatchObject({
        type: DiscoveryErrors.LocationDisabledManualAction,
        error: response,
        resolution: { type: "manual-action", retry },
      });
    },
  );

  it("GIVEN the native location helper fails unexpectedly, WHEN running preflight, THEN it should return an unknown discovery error", async () => {
    // GIVEN
    const nativeError = new Error("native failure");
    const checkAndRequestEnablingLocationServices = jest.fn().mockRejectedValue(nativeError);
    const check = new AndroidLocationServicePreflightCheck(retry, () => ({
      checkAndRequestEnablingLocationServices,
    }));

    // WHEN
    const result = await check.run(makeRequirements());

    // THEN
    expect(getError(result)).toMatchObject({
      type: DiscoveryErrors.Unknown,
      error: nativeError,
      resolution: { type: "check-only", retry },
    });
  });
});

const makeCheck = (response: LocationServiceResponse) => {
  const checkAndRequestEnablingLocationServices = jest.fn<Promise<LocationServiceResponse>, []>();
  checkAndRequestEnablingLocationServices.mockResolvedValue(response);

  const locationHelper: LocationHelperModule = { checkAndRequestEnablingLocationServices };
  const check = new AndroidLocationServicePreflightCheck(retry, () => locationHelper);

  return { check, checkAndRequestEnablingLocationServices };
};

const makeRequirements = (): AndroidPreflightRequirements => ({
  sdk: "test",
  matches: () => true,
  checks: ["location-service"],
  bluetoothPermissions: [],
  locationPermission: null,
});

const getError = (result: DiscoveryPreflightResult): DiscoveryError => {
  if (result.success) {
    throw new Error("Expected a failed preflight result");
  }

  return result.discoveryError;
};
