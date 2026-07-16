import type { Permission } from "react-native";
import type { MobileDiscoveryError } from "../../../types";
import { AndroidBluetoothPermissionPreflightCheck } from "./AndroidBluetoothPermissionPreflightCheck";
import type { AndroidPreflightRequirements } from "./androidPreflightRequirements";
import {
  buildBluetoothPermissionManualSettingsError,
  buildBluetoothPermissionPromptableError,
} from "../discoveryErrorBuilders";
import { runPermissionPreflight } from "./permissionHelpers";
import type { DiscoveryPreflightResult } from "../preflightResult";

jest.mock("./permissionHelpers", () => ({
  runPermissionPreflight: jest.fn(),
}));

const retry = jest.fn<Promise<true | MobileDiscoveryError>, []>();

describe("AndroidBluetoothPermissionPreflightCheck", () => {
  beforeEach(() => {
    retry.mockReset();
    jest.mocked(runPermissionPreflight).mockReset();
  });

  it("GIVEN Bluetooth permissions, WHEN running preflight, THEN it should delegate to the permission helper", async () => {
    // GIVEN
    const result: DiscoveryPreflightResult = { success: true };
    const bluetoothPermissions = [
      "android.permission.BLUETOOTH_SCAN",
      "android.permission.BLUETOOTH_CONNECT",
    ] as Permission[];
    const requirements = makeRequirements({ bluetoothPermissions });
    jest.mocked(runPermissionPreflight).mockResolvedValue(result);

    // WHEN
    const preflightResult = await new AndroidBluetoothPermissionPreflightCheck(retry).run(
      requirements,
    );

    // THEN
    expect(preflightResult).toBe(result);
    expect(runPermissionPreflight).toHaveBeenCalledWith({
      permissions: bluetoothPermissions,
      retry,
      buildPromptableError: buildBluetoothPermissionPromptableError,
      buildManualSettingsError: buildBluetoothPermissionManualSettingsError,
    });
  });
});

const makeRequirements = (
  override: Partial<AndroidPreflightRequirements> = {},
): AndroidPreflightRequirements => ({
  sdk: "test",
  matches: () => true,
  checks: ["bluetooth-permission"],
  bluetoothPermissions: [],
  locationPermission: null,
  ...override,
});
