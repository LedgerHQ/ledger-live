import { PermissionsAndroid, type Permission } from "react-native";
import type { MobileDiscoveryError } from "../../../types";
import { requestPermission, requestPermissions, runPermissionPreflight } from "./permissionHelpers";

jest.mock("react-native", () => ({
  PermissionsAndroid: {
    PERMISSIONS: {
      BLUETOOTH_CONNECT: "android.permission.BLUETOOTH_CONNECT",
      BLUETOOTH_SCAN: "android.permission.BLUETOOTH_SCAN",
    },
    RESULTS: {
      GRANTED: "granted",
      DENIED: "denied",
      NEVER_ASK_AGAIN: "never_ask_again",
    },
    check: jest.fn(),
    request: jest.fn(),
    requestMultiple: jest.fn(),
  },
}));

const { RESULTS } = PermissionsAndroid;
const bluetoothScanPermission: Permission = PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN;
const bluetoothConnectPermission: Permission = PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT;

describe("permissionHelpers", () => {
  beforeEach(() => {
    jest.mocked(PermissionsAndroid.check).mockReset();
    jest.mocked(PermissionsAndroid.request).mockReset();
    jest.mocked(PermissionsAndroid.requestMultiple).mockReset();
  });

  it("GIVEN a permission request is denied, WHEN requesting, THEN it should keep the native promptable status", async () => {
    // GIVEN
    jest.mocked(PermissionsAndroid.request).mockResolvedValue(RESULTS.DENIED);

    // WHEN
    const result = await requestPermission(bluetoothScanPermission);

    // THEN
    expect(result).toEqual({
      granted: false,
      neverAskAgain: false,
      deniedPermissions: [bluetoothScanPermission],
    });
  });

  it("GIVEN a permission request resolves to never ask again, WHEN requesting, THEN it should require manual settings", async () => {
    // GIVEN
    jest.mocked(PermissionsAndroid.request).mockResolvedValue(RESULTS.NEVER_ASK_AGAIN);

    // WHEN
    const result = await requestPermission(bluetoothScanPermission);

    // THEN
    expect(result).toEqual({
      granted: false,
      neverAskAgain: true,
      deniedPermissions: [bluetoothScanPermission],
    });
  });

  it("GIVEN multiple permission requests are denied, WHEN requesting, THEN it should keep them promptable", async () => {
    // GIVEN
    const permissions = [bluetoothScanPermission, bluetoothConnectPermission];
    const requestMultipleResult = {
      [bluetoothScanPermission]: RESULTS.DENIED,
      [bluetoothConnectPermission]: RESULTS.DENIED,
    } as Awaited<ReturnType<typeof PermissionsAndroid.requestMultiple>>;
    jest.mocked(PermissionsAndroid.requestMultiple).mockResolvedValue(requestMultipleResult);

    // WHEN
    const result = await requestPermissions(permissions);

    // THEN
    expect(result).toEqual({
      granted: false,
      neverAskAgain: false,
      deniedPermissions: permissions,
    });
  });

  it("GIVEN missing permission remains promptable, WHEN running preflight, THEN it should return a promptable error", async () => {
    // GIVEN
    const retry = jest.fn<Promise<true | MobileDiscoveryError>, []>();
    const promptableError = { type: "promptable" } as unknown as MobileDiscoveryError;
    const manualSettingsError = { type: "manual-settings" } as unknown as MobileDiscoveryError;
    const buildPromptableError = jest.fn(() => promptableError);
    const buildManualSettingsError = jest.fn(() => manualSettingsError);
    jest.mocked(PermissionsAndroid.check).mockResolvedValue(false);
    jest.mocked(PermissionsAndroid.request).mockResolvedValue(RESULTS.DENIED);

    // WHEN
    const result = await runPermissionPreflight({
      permissions: [bluetoothScanPermission],
      retry,
      buildPromptableError,
      buildManualSettingsError,
    });

    // THEN
    expect(result).toEqual({ success: false, discoveryError: promptableError });
    expect(buildPromptableError).toHaveBeenCalledWith([bluetoothScanPermission], retry);
    expect(buildManualSettingsError).not.toHaveBeenCalled();
  });

  it("GIVEN missing permission can no longer be prompted, WHEN running preflight, THEN it should return a manual settings error", async () => {
    // GIVEN
    const retry = jest.fn<Promise<true | MobileDiscoveryError>, []>();
    const promptableError = { type: "promptable" } as unknown as MobileDiscoveryError;
    const manualSettingsError = { type: "manual-settings" } as unknown as MobileDiscoveryError;
    const buildPromptableError = jest.fn(() => promptableError);
    const buildManualSettingsError = jest.fn(() => manualSettingsError);
    jest.mocked(PermissionsAndroid.check).mockResolvedValue(false);
    jest.mocked(PermissionsAndroid.request).mockResolvedValue(RESULTS.NEVER_ASK_AGAIN);

    // WHEN
    const result = await runPermissionPreflight({
      permissions: [bluetoothScanPermission],
      retry,
      buildPromptableError,
      buildManualSettingsError,
    });

    // THEN
    expect(result).toEqual({ success: false, discoveryError: manualSettingsError });
    expect(buildPromptableError).not.toHaveBeenCalled();
    expect(buildManualSettingsError).toHaveBeenCalledWith([bluetoothScanPermission], retry);
  });

  it("GIVEN multiple missing permissions with a mixed native status, WHEN running preflight, THEN it should return a manual settings error", async () => {
    // GIVEN
    const permissions = [bluetoothScanPermission, bluetoothConnectPermission];
    const retry = jest.fn<Promise<true | MobileDiscoveryError>, []>();
    const promptableError = { type: "promptable" } as unknown as MobileDiscoveryError;
    const manualSettingsError = { type: "manual-settings" } as unknown as MobileDiscoveryError;
    const buildPromptableError = jest.fn(() => promptableError);
    const buildManualSettingsError = jest.fn(() => manualSettingsError);
    const requestMultipleResult = {
      [bluetoothScanPermission]: RESULTS.DENIED,
      [bluetoothConnectPermission]: RESULTS.NEVER_ASK_AGAIN,
    } as Awaited<ReturnType<typeof PermissionsAndroid.requestMultiple>>;
    jest.mocked(PermissionsAndroid.check).mockResolvedValue(false);
    jest.mocked(PermissionsAndroid.requestMultiple).mockResolvedValue(requestMultipleResult);

    // WHEN
    const result = await runPermissionPreflight({
      permissions,
      retry,
      buildPromptableError,
      buildManualSettingsError,
    });

    // THEN
    expect(result).toEqual({ success: false, discoveryError: manualSettingsError });
    expect(PermissionsAndroid.request).not.toHaveBeenCalled();
    expect(PermissionsAndroid.requestMultiple).toHaveBeenCalledWith(permissions);
    expect(buildPromptableError).not.toHaveBeenCalled();
    expect(buildManualSettingsError).toHaveBeenCalledWith(permissions, retry);
  });
});
