import { State as BlePlxState } from "react-native-ble-plx";
import { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
import { DiscoveryErrors } from "../../../types";
import { BlePlxManager } from "../../../../transport/BlePlxManager";
import { getBluetoothHelperModule } from "../nativeModules";
import { IosBleDiscoveryPreflightChecks } from "./IosBleDiscoveryPreflightChecks";
import type { DiscoveryPreflightResult } from "../preflightResult";

jest.mock("react-native-ble-plx", () => ({
  BleManager: jest.fn(),
  State: {
    PoweredOn: "PoweredOn",
    PoweredOff: "PoweredOff",
    Resetting: "Resetting",
    Unauthorized: "Unauthorized",
    Unknown: "Unknown",
    Unsupported: "Unsupported",
  },
}));

jest.mock("../nativeModules", () => ({
  getBluetoothHelperModule: jest.fn(),
}));

describe("IosBleDiscoveryPreflightChecks", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.mocked(getBluetoothHelperModule).mockReset();
  });

  it("GIVEN Bluetooth prompt and powered-on state, WHEN running preflight, THEN it should succeed", async () => {
    // GIVEN
    const prompt = jest.fn().mockResolvedValue(undefined);
    jest.mocked(getBluetoothHelperModule).mockReturnValue({ prompt });
    jest.spyOn(BlePlxManager, "state").mockResolvedValue(BlePlxState.PoweredOn);

    // WHEN
    const result = await new IosBleDiscoveryPreflightChecks().getPreflight();

    // THEN
    expect(result).toEqual({ success: true });
    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it("GIVEN Bluetooth prompt fails, WHEN running preflight, THEN it should still check state", async () => {
    // GIVEN
    jest.mocked(getBluetoothHelperModule).mockReturnValue({
      prompt: jest.fn().mockRejectedValue(new Error("prompt failure")),
    });
    jest.spyOn(BlePlxManager, "state").mockResolvedValue(BlePlxState.PoweredOn);

    // WHEN
    const result = await new IosBleDiscoveryPreflightChecks().getPreflight();

    // THEN
    expect(result).toEqual({ success: true });
    expect(BlePlxManager.state).toHaveBeenCalledTimes(1);
  });

  it("GIVEN no Bluetooth prompt helper, WHEN running preflight, THEN it should still check state", async () => {
    // GIVEN
    jest.mocked(getBluetoothHelperModule).mockReturnValue(undefined);
    jest.spyOn(BlePlxManager, "state").mockResolvedValue(BlePlxState.PoweredOn);

    // WHEN
    const result = await new IosBleDiscoveryPreflightChecks().getPreflight();

    // THEN
    expect(result).toEqual({ success: true });
    expect(BlePlxManager.state).toHaveBeenCalledTimes(1);
  });

  it("GIVEN powered-off state, WHEN running preflight, THEN it should return Bluetooth disabled manual action error", async () => {
    // GIVEN
    jest.mocked(getBluetoothHelperModule).mockReturnValue(undefined);
    jest.spyOn(BlePlxManager, "state").mockResolvedValue(BlePlxState.PoweredOff);

    // WHEN
    const result = await new IosBleDiscoveryPreflightChecks().getPreflight();

    // THEN
    expect(result).toMatchObject({
      success: false,
      discoveryError: {
        type: DiscoveryErrors.BluetoothDisabledManualAction,
        transportID: rnBleTransportIdentifier,
        resolution: { type: "manual-action" },
      },
    });
    await expect(callRetry(result)).resolves.toMatchObject({
      type: DiscoveryErrors.BluetoothDisabledManualAction,
    });
  });

  it("GIVEN unauthorized state, WHEN running preflight, THEN it should return Bluetooth permission error", async () => {
    // GIVEN
    jest.mocked(getBluetoothHelperModule).mockReturnValue(undefined);
    jest.spyOn(BlePlxManager, "state").mockResolvedValue(BlePlxState.Unauthorized);

    // WHEN
    const result = await new IosBleDiscoveryPreflightChecks().getPreflight();

    // THEN
    expect(result).toMatchObject({
      success: false,
      discoveryError: {
        type: DiscoveryErrors.BluetoothPermissionUnauthorizedManualSettings,
        transportID: rnBleTransportIdentifier,
        resolution: { type: "manual-action" },
      },
    });
    await expect(callRetry(result)).resolves.toMatchObject({
      type: DiscoveryErrors.BluetoothPermissionUnauthorizedManualSettings,
    });
  });

  it("GIVEN unknown state, WHEN running preflight, THEN it should return check-only Bluetooth state error", async () => {
    // GIVEN
    jest.mocked(getBluetoothHelperModule).mockReturnValue(undefined);
    jest.spyOn(BlePlxManager, "state").mockResolvedValue(BlePlxState.Unknown);

    // WHEN
    const result = await new IosBleDiscoveryPreflightChecks().getPreflight();

    // THEN
    expect(result).toMatchObject({
      success: false,
      discoveryError: {
        type: DiscoveryErrors.BluetoothStateUnknownCheckOnly,
        transportID: rnBleTransportIdentifier,
        state: BlePlxState.Unknown,
        resolution: { type: "check-only" },
      },
    });
    await expect(callRetry(result)).resolves.toMatchObject({
      type: DiscoveryErrors.BluetoothStateUnknownCheckOnly,
    });
  });

  it("GIVEN state check fails, WHEN running preflight, THEN it should return unknown discovery error", async () => {
    // GIVEN
    const error = new Error("state failure");
    jest.mocked(getBluetoothHelperModule).mockReturnValue(undefined);
    jest.spyOn(BlePlxManager, "state").mockRejectedValue(error);

    // WHEN
    const result = await new IosBleDiscoveryPreflightChecks().getPreflight();

    // THEN
    expect(result).toMatchObject({
      success: false,
      discoveryError: {
        type: DiscoveryErrors.Unknown,
        transportID: rnBleTransportIdentifier,
        error,
        resolution: { type: "check-only" },
      },
    });
    await expect(callRetry(result)).resolves.toMatchObject({
      type: DiscoveryErrors.Unknown,
    });
  });
});

const callRetry = (result: DiscoveryPreflightResult) => {
  if (result.success || !result.discoveryError.resolution) {
    throw new Error("Expected a failed preflight result with retryable resolution");
  }

  const { resolution } = result.discoveryError;

  if (resolution.type === "none") {
    throw new Error("Expected a retryable resolution");
  }

  return resolution.retry();
};
