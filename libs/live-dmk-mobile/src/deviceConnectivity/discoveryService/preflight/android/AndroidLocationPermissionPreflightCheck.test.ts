import type { Permission } from "react-native";
import type { MobileDiscoveryError } from "../../../types";
import { AndroidLocationPermissionPreflightCheck } from "./AndroidLocationPermissionPreflightCheck";
import type { AndroidPreflightRequirements } from "./androidPreflightRequirements";
import {
  buildLocationPermissionManualSettingsError,
  buildLocationPermissionPromptableError,
} from "../discoveryErrorBuilders";
import { runPermissionPreflight } from "./permissionHelpers";
import type { DiscoveryPreflightResult } from "../preflightResult";

jest.mock("./permissionHelpers", () => ({
  runPermissionPreflight: jest.fn(),
}));

const retry = jest.fn<Promise<true | MobileDiscoveryError>, []>();

describe("AndroidLocationPermissionPreflightCheck", () => {
  beforeEach(() => {
    retry.mockReset();
    jest.mocked(runPermissionPreflight).mockReset();
  });

  it("GIVEN a location permission requirement, WHEN running preflight, THEN it should delegate that permission to the helper", async () => {
    // GIVEN
    const result: DiscoveryPreflightResult = { success: true };
    const locationPermission = "android.permission.ACCESS_FINE_LOCATION" as Permission;
    const requirements = makeRequirements({ locationPermission });
    jest.mocked(runPermissionPreflight).mockResolvedValue(result);

    // WHEN
    const preflightResult = await new AndroidLocationPermissionPreflightCheck(retry).run(
      requirements,
    );

    // THEN
    expect(preflightResult).toBe(result);
    expect(runPermissionPreflight).toHaveBeenCalledWith({
      permissions: [locationPermission],
      retry,
      buildPromptableError: buildLocationPermissionPromptableError,
      buildManualSettingsError: buildLocationPermissionManualSettingsError,
    });
  });

  it("GIVEN no location permission requirement, WHEN running preflight, THEN it should delegate an empty permission list", async () => {
    // GIVEN
    const result: DiscoveryPreflightResult = { success: true };
    const requirements = makeRequirements({ locationPermission: null });
    jest.mocked(runPermissionPreflight).mockResolvedValue(result);

    // WHEN
    const preflightResult = await new AndroidLocationPermissionPreflightCheck(retry).run(
      requirements,
    );

    // THEN
    expect(preflightResult).toBe(result);
    expect(runPermissionPreflight).toHaveBeenCalledWith({
      permissions: [],
      retry,
      buildPromptableError: buildLocationPermissionPromptableError,
      buildManualSettingsError: buildLocationPermissionManualSettingsError,
    });
  });
});

const makeRequirements = (
  override: Partial<AndroidPreflightRequirements> = {},
): AndroidPreflightRequirements => ({
  sdk: "test",
  matches: () => true,
  checks: ["location-permission"],
  bluetoothPermissions: [],
  locationPermission: null,
  ...override,
});
