import { act, renderHook } from "tests/testSetup";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import useCompanionSteps, { StepKey } from "../useCompanionSteps";

const mockDevice: Device = {
  deviceId: "test-device",
  modelId: DeviceModelId.nanoX,
  wired: true,
};

describe("useCompanionSteps", () => {
  it("should return correct amount of steps when two step version", () => {
    const { result } = renderHook(
      () =>
        useCompanionSteps({
          device: mockDevice,
          setStepKey: jest.fn(),
          shouldRestoreApps: false,
          deviceName: "stax",
          seedPathStatus: "new_seed",
          productName: "stax",
          isTwoStep: true,
        }),
      {
        minimal: false,
      },
    );

    expect(result.current.defaultSteps).toHaveLength(3);
  });

  it("should return correct amount of steps when not two step", () => {
    const { result } = renderHook(
      () =>
        useCompanionSteps({
          device: mockDevice,
          setStepKey: jest.fn(),
          shouldRestoreApps: false,
          deviceName: "stax",
          seedPathStatus: "new_seed",
          productName: "stax",
          isTwoStep: false,
        }),
      {
        minimal: false,
      },
    );

    expect(result.current.defaultSteps).toHaveLength(5);
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
          isTwoStep: false,
        }),
      {
        minimal: false,
      },
    );

    act(result.current.handleAppStepComplete);

    expect(mockSetStep).toHaveBeenCalledWith(StepKey.Exit);
  });
});
