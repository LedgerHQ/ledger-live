import { PermissionsAndroid, type Permission } from "react-native";
import {
  DEFAULT_PERMISSION_REQUEST_TIMEOUT_MS,
  requestPermission,
  requestPermissions,
} from "./permissionHelpers";

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
    jest.useFakeTimers();
    jest.mocked(PermissionsAndroid.request).mockReset();
    jest.mocked(PermissionsAndroid.requestMultiple).mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("GIVEN a single permission request does not resolve, WHEN the timeout is reached, THEN it should require manual settings", async () => {
    // GIVEN
    jest.mocked(PermissionsAndroid.request).mockImplementation(() => new Promise(() => undefined));

    // WHEN
    const resultPromise = requestPermission(bluetoothScanPermission);
    await jest.advanceTimersByTimeAsync(DEFAULT_PERMISSION_REQUEST_TIMEOUT_MS);

    // THEN
    await expect(resultPromise).resolves.toEqual({
      granted: false,
      neverAskAgain: true,
      deniedPermissions: [bluetoothScanPermission],
    });
  });

  it("GIVEN a multiple permissions request does not resolve, WHEN the timeout is reached, THEN it should require manual settings", async () => {
    // GIVEN
    const permissions = [bluetoothScanPermission, bluetoothConnectPermission];
    jest
      .mocked(PermissionsAndroid.requestMultiple)
      .mockImplementation(() => new Promise(() => undefined));

    // WHEN
    const resultPromise = requestPermissions(permissions);
    await jest.advanceTimersByTimeAsync(DEFAULT_PERMISSION_REQUEST_TIMEOUT_MS);

    // THEN
    await expect(resultPromise).resolves.toEqual({
      granted: false,
      neverAskAgain: true,
      deniedPermissions: permissions,
    });
  });

  it("GIVEN a permission request resolves before the timeout, WHEN requesting, THEN it should keep the native status", async () => {
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
});
