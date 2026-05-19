import { PermissionsAndroid } from "react-native";
import { State as BlePlxState } from "react-native-ble-plx";
import { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
import { DiscoveryErrors, type DiscoveryError } from "../../types";
import {
  buildBluetoothDisabledManualActionError,
  buildBluetoothDisabledPromptableError,
  buildBluetoothPermissionManualSettingsError,
  buildBluetoothPermissionPromptableError,
  buildBluetoothStateError,
  buildLocationDisabledManualActionError,
  buildLocationDisabledPromptableError,
  buildLocationPermissionManualSettingsError,
  buildLocationPermissionPromptableError,
  buildLocationServicePermissionMissingError,
  buildUnknownDiscoveryError,
} from "./discoveryErrorBuilders";

jest.mock("react-native", () => ({
  PermissionsAndroid: {
    PERMISSIONS: {
      ACCESS_FINE_LOCATION: "android.permission.ACCESS_FINE_LOCATION",
      BLUETOOTH_CONNECT: "android.permission.BLUETOOTH_CONNECT",
      BLUETOOTH_SCAN: "android.permission.BLUETOOTH_SCAN",
    },
  },
}));

jest.mock("react-native-ble-plx", () => ({
  State: {
    PoweredOn: "PoweredOn",
    PoweredOff: "PoweredOff",
    Resetting: "Resetting",
    Unauthorized: "Unauthorized",
    Unknown: "Unknown",
    Unsupported: "Unsupported",
  },
}));

const retry = jest.fn<Promise<true | DiscoveryError>, []>();
const { PERMISSIONS } = PermissionsAndroid;

describe("discoveryErrorBuilders", () => {
  beforeEach(() => {
    retry.mockReset();
  });

  it("GIVEN Bluetooth permissions can be prompted, WHEN building the error, THEN it should include prompt resolution", () => {
    // GIVEN
    const permissions = [PERMISSIONS.BLUETOOTH_SCAN, PERMISSIONS.BLUETOOTH_CONNECT];

    // WHEN
    const error = buildBluetoothPermissionPromptableError(permissions, retry);

    // THEN
    expect(error).toEqual({
      type: DiscoveryErrors.BluetoothPermissionDeniedPromptable,
      transportID: rnBleTransportIdentifier,
      permissions,
      resolution: { type: "prompt", retry },
    });
  });

  it("GIVEN Bluetooth permissions require settings, WHEN building the error, THEN it should include manual action resolution", () => {
    // GIVEN
    const permissions = [PERMISSIONS.BLUETOOTH_SCAN, PERMISSIONS.BLUETOOTH_CONNECT];

    // WHEN
    const error = buildBluetoothPermissionManualSettingsError(permissions, retry);

    // THEN
    expect(error).toEqual({
      type: DiscoveryErrors.BluetoothPermissionDeniedManualSettings,
      transportID: rnBleTransportIdentifier,
      permissions,
      resolution: { type: "manual-action", retry },
    });
  });

  it("GIVEN Bluetooth can be prompted, WHEN building disabled error, THEN it should include prompt resolution", () => {
    // GIVEN / WHEN
    const error = buildBluetoothDisabledPromptableError(retry);

    // THEN
    expect(error).toEqual({
      type: DiscoveryErrors.BluetoothDisabledPromptable,
      transportID: rnBleTransportIdentifier,
      resolution: { type: "prompt", retry },
    });
  });

  it("GIVEN Bluetooth requires manual action, WHEN building disabled error, THEN it should include the original error", () => {
    // GIVEN
    const nativeError = new Error("native failure");

    // WHEN
    const error = buildBluetoothDisabledManualActionError(retry, nativeError);

    // THEN
    expect(error).toEqual({
      type: DiscoveryErrors.BluetoothDisabledManualAction,
      transportID: rnBleTransportIdentifier,
      error: nativeError,
      resolution: { type: "manual-action", retry },
    });
  });

  it("GIVEN Bluetooth is unauthorized, WHEN building state error, THEN it should require manual settings", () => {
    // GIVEN / WHEN
    const error = buildBluetoothStateError(BlePlxState.Unauthorized, retry);

    // THEN
    expect(error).toEqual({
      type: DiscoveryErrors.BluetoothPermissionUnauthorizedManualSettings,
      transportID: rnBleTransportIdentifier,
      resolution: { type: "manual-action", retry },
    });
  });

  it("GIVEN Bluetooth is unsupported, WHEN building state error, THEN it should not expose retry", () => {
    // GIVEN / WHEN
    const error = buildBluetoothStateError(BlePlxState.Unsupported, retry);

    // THEN
    expect(error).toEqual({
      type: DiscoveryErrors.BluetoothUnsupported,
      transportID: rnBleTransportIdentifier,
      resolution: { type: "none" },
    });
  });

  it("GIVEN Bluetooth state is unknown, WHEN building state error, THEN it should include check-only resolution", () => {
    // GIVEN / WHEN
    const error = buildBluetoothStateError(BlePlxState.Unknown, retry);

    // THEN
    expect(error).toEqual({
      type: DiscoveryErrors.BluetoothStateUnknownCheckOnly,
      transportID: rnBleTransportIdentifier,
      state: BlePlxState.Unknown,
      resolution: { type: "check-only", retry },
    });
  });

  it("GIVEN location permission can be prompted, WHEN building the error, THEN it should include prompt resolution", () => {
    // GIVEN
    const permission = PERMISSIONS.ACCESS_FINE_LOCATION;

    // WHEN
    const error = buildLocationPermissionPromptableError([permission], retry);

    // THEN
    expect(error).toEqual({
      type: DiscoveryErrors.LocationPermissionDeniedPromptable,
      transportID: rnBleTransportIdentifier,
      permission,
      resolution: { type: "prompt", retry },
    });
  });

  it("GIVEN location permission requires settings, WHEN building the error, THEN it should include manual action resolution", () => {
    // GIVEN
    const permission = PERMISSIONS.ACCESS_FINE_LOCATION;

    // WHEN
    const error = buildLocationPermissionManualSettingsError([permission], retry);

    // THEN
    expect(error).toEqual({
      type: DiscoveryErrors.LocationPermissionDeniedManualSettings,
      transportID: rnBleTransportIdentifier,
      permission,
      resolution: { type: "manual-action", retry },
    });
  });

  it("GIVEN location service can be prompted, WHEN building disabled error, THEN it should include prompt resolution", () => {
    // GIVEN / WHEN
    const error = buildLocationDisabledPromptableError(retry);

    // THEN
    expect(error).toEqual({
      type: DiscoveryErrors.LocationDisabledPromptable,
      transportID: rnBleTransportIdentifier,
      resolution: { type: "prompt", retry },
    });
  });

  it("GIVEN location service requires manual action, WHEN building disabled error, THEN it should include the original error", () => {
    // GIVEN
    const nativeError = new Error("native failure");

    // WHEN
    const error = buildLocationDisabledManualActionError(retry, nativeError);

    // THEN
    expect(error).toEqual({
      type: DiscoveryErrors.LocationDisabledManualAction,
      transportID: rnBleTransportIdentifier,
      error: nativeError,
      resolution: { type: "manual-action", retry },
    });
  });

  it("GIVEN location service misses permission, WHEN building the error, THEN it should include check-only resolution", () => {
    // GIVEN / WHEN
    const error = buildLocationServicePermissionMissingError(retry);

    // THEN
    expect(error).toEqual({
      type: DiscoveryErrors.LocationServicePermissionMissing,
      transportID: rnBleTransportIdentifier,
      resolution: { type: "check-only", retry },
    });
  });

  it("GIVEN unknown failure, WHEN building the error, THEN it should include check-only resolution and original error", () => {
    // GIVEN
    const unknownError = new Error("unknown");

    // WHEN
    const error = buildUnknownDiscoveryError(unknownError, retry);

    // THEN
    expect(error).toEqual({
      type: DiscoveryErrors.Unknown,
      transportID: rnBleTransportIdentifier,
      error: unknownError,
      resolution: { type: "check-only", retry },
    });
  });
});
