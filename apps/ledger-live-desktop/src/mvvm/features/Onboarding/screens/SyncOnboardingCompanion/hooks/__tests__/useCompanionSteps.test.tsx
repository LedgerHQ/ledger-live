import { act, renderHook } from "tests/testSetup";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/devices";
import useCompanionSteps, { StepKey } from "../useCompanionSteps";

const mockDevice: Device = {
  deviceId: "test-device",
  modelId: DeviceModelId.nanoX,
  wired: true,
};

describe("useCompanionSteps", () => {
  it("should return correct amount of steps when Ledger Sync is not active", () => {
    const { result } = renderHook(
      () =>
        useCompanionSteps({
          device: mockDevice,
          setStepKey: jest.fn(),
          shouldRestoreApps: false,
          deviceName: "stax",
          seedPathStatus: "new_seed",
          productName: "stax",
        }),
      {
        minimal: false,
      },
    );

    expect(result.current.defaultSteps).toHaveLength(4);
    expect(result.current.hasSyncStep).toBe(true);
  });

  it("should omit Sync step when Ledger Sync is already active", () => {
    const { result } = renderHook(
      () =>
        useCompanionSteps({
          device: mockDevice,
          setStepKey: jest.fn(),
          shouldRestoreApps: false,
          deviceName: "stax",
          seedPathStatus: "new_seed",
          productName: "stax",
        }),
      {
        minimal: false,
        initialState: {
          trustchain: {
            trustchain: { rootId: "existing-root-id", walletSyncEncryptionKey: "" },
          },
        },
      },
    );

    expect(result.current.defaultSteps).toHaveLength(3);
    expect(result.current.hasSyncStep).toBe(false);
  });

  it("should return callback to complete app step", () => {
    const mockSetStep = jest.fn();
    const { result } = renderHook(
      () =>
        useCompanionSteps({
          device: mockDevice,
          setStepKey: mockSetStep,
          shouldRestoreApps: false,
          deviceName: "stax",
          seedPathStatus: "new_seed",
          productName: "stax",
        }),
      {
        minimal: false,
      },
    );

    act(result.current.handleAppStepComplete);

    expect(mockSetStep).toHaveBeenCalledWith(StepKey.Exit);
  });
});
