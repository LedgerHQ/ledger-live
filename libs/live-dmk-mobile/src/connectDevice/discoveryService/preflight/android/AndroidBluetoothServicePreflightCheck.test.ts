import { State as BlePlxState } from "react-native-ble-plx";
import type { DiscoveryError } from "../../../types";
import { DiscoveryErrorTypes } from "../../../types";
import {
  AndroidBluetoothServicePreflightCheck,
  type BleStateProvider,
} from "./AndroidBluetoothServicePreflightCheck";
import type { AndroidPreflightRequirements } from "./androidPreflightRequirements";
import type { BluetoothHelperModule } from "../nativeModules";
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

const retry = jest.fn<Promise<true | DiscoveryError>, []>();

describe("AndroidBluetoothServicePreflightCheck", () => {
  beforeEach(() => {
    retry.mockReset();
  });

  it("GIVEN Bluetooth is powered on, WHEN running preflight, THEN it should succeed without prompting", async () => {
    // GIVEN
    const { check, getBluetoothHelper, getState } = makeCheck({
      states: [BlePlxState.PoweredOn],
    });

    // WHEN
    const result = await check.run(makeRequirements());

    // THEN
    expect(result).toEqual({ success: true });
    expect(getState).toHaveBeenCalledTimes(1);
    expect(getBluetoothHelper).not.toHaveBeenCalled();
  });

  it("GIVEN Bluetooth is in an unknown state, WHEN running preflight, THEN it should return a check-only Bluetooth state error", async () => {
    // GIVEN
    const { check } = makeCheck({ states: [BlePlxState.Unknown] });

    // WHEN
    const result = await check.run(makeRequirements());

    // THEN
    expect(getError(result)).toMatchObject({
      type: DiscoveryErrorTypes.BluetoothStateUnknownCheckOnly,
      state: BlePlxState.Unknown,
      resolution: { type: "check-only", retry },
    });
  });

  it("GIVEN Bluetooth is powered off and no prompt helper exists, WHEN running preflight, THEN it should require manual action", async () => {
    // GIVEN
    const { check } = makeCheck({ states: [BlePlxState.PoweredOff] });

    // WHEN
    const result = await check.run(makeRequirements());

    // THEN
    expect(getError(result)).toMatchObject({
      type: DiscoveryErrorTypes.BluetoothDisabledManualAction,
      resolution: { type: "manual-action", retry },
    });
  });

  it("GIVEN Bluetooth is powered off and the prompt enables it, WHEN running preflight, THEN it should succeed", async () => {
    // GIVEN
    const prompt = jest.fn().mockResolvedValue(undefined);
    const { check, getState } = makeCheck({
      states: [BlePlxState.PoweredOff, BlePlxState.PoweredOn],
      bluetoothHelper: { prompt },
    });

    // WHEN
    const result = await check.run(makeRequirements());

    // THEN
    expect(result).toEqual({ success: true });
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(getState).toHaveBeenCalledTimes(2);
  });

  it("GIVEN Bluetooth stays powered off after the prompt, WHEN running preflight, THEN it should require manual action", async () => {
    // GIVEN
    const prompt = jest.fn().mockResolvedValue(undefined);
    const { check } = makeCheck({
      states: [BlePlxState.PoweredOff, BlePlxState.PoweredOff],
      bluetoothHelper: { prompt },
    });

    // WHEN
    const result = await check.run(makeRequirements());

    // THEN
    expect(getError(result)).toMatchObject({
      type: DiscoveryErrorTypes.BluetoothDisabledManualAction,
      resolution: { type: "manual-action", retry },
    });
  });

  it("GIVEN Bluetooth enters an unknown state after the prompt, WHEN running preflight, THEN it should return a state error", async () => {
    // GIVEN
    const prompt = jest.fn().mockResolvedValue(undefined);
    const { check } = makeCheck({
      states: [BlePlxState.PoweredOff, BlePlxState.Resetting],
      bluetoothHelper: { prompt },
    });

    // WHEN
    const result = await check.run(makeRequirements());

    // THEN
    expect(getError(result)).toMatchObject({
      type: DiscoveryErrorTypes.BluetoothStateUnknownCheckOnly,
      state: BlePlxState.Resetting,
      resolution: { type: "check-only", retry },
    });
  });

  it("GIVEN the user cancels the Bluetooth prompt, WHEN running preflight, THEN it should return a promptable Bluetooth disabled error", async () => {
    // GIVEN
    const prompt = jest.fn().mockRejectedValue({ code: "E_BLE_CANCELLED" });
    const { check } = makeCheck({
      states: [BlePlxState.PoweredOff],
      bluetoothHelper: { E_BLE_CANCELLED: "E_BLE_CANCELLED", prompt },
    });

    // WHEN
    const result = await check.run(makeRequirements());

    // THEN
    expect(getError(result)).toMatchObject({
      type: DiscoveryErrorTypes.BluetoothDisabledPromptable,
      resolution: { type: "prompt", retry },
    });
  });

  it("GIVEN the Bluetooth prompt fails unexpectedly, WHEN running preflight, THEN it should require manual action with the native error", async () => {
    // GIVEN
    const nativeError = new Error("prompt failure");
    const prompt = jest.fn().mockRejectedValue(nativeError);
    const { check } = makeCheck({
      states: [BlePlxState.PoweredOff],
      bluetoothHelper: { E_BLE_CANCELLED: "E_BLE_CANCELLED", prompt },
    });

    // WHEN
    const result = await check.run(makeRequirements());

    // THEN
    expect(getError(result)).toMatchObject({
      type: DiscoveryErrorTypes.BluetoothDisabledManualAction,
      error: nativeError,
      resolution: { type: "manual-action", retry },
    });
  });
});

const makeCheck = ({
  states,
  bluetoothHelper,
}: {
  states: BlePlxState[];
  bluetoothHelper?: BluetoothHelperModule;
}) => {
  const getState = jest.fn<Promise<BlePlxState>, []>();
  for (const state of states) {
    getState.mockResolvedValueOnce(state);
  }

  const bleStateProvider: BleStateProvider = { getState };
  const getBluetoothHelper = jest.fn(() => bluetoothHelper);
  const check = new AndroidBluetoothServicePreflightCheck(
    retry,
    bleStateProvider,
    getBluetoothHelper,
  );

  return { check, getBluetoothHelper, getState };
};

const makeRequirements = (): AndroidPreflightRequirements => ({
  sdk: "test",
  matches: () => true,
  checks: ["bluetooth-service"],
  bluetoothPermissions: [],
  locationPermission: null,
});

const getError = (result: DiscoveryPreflightResult): DiscoveryError => {
  if (result.success) {
    throw new Error("Expected a failed preflight result");
  }

  return result.discoveryError;
};
