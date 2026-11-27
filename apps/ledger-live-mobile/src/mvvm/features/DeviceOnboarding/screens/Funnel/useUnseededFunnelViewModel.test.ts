import { act, renderHook } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  useRestoreDismissal,
  useUnseededFunnelViewModel,
  type UnseededFunnelInput,
} from "./useUnseededFunnelViewModel";

const device = {
  deviceId: "device-id",
  deviceName: "Ledger Stax",
  modelId: DeviceModelId.stax,
  wired: false,
} as Device;

function input(machineState: string): Omit<UnseededFunnelInput, "restoreDismissal"> {
  return {
    machineState,
    liveMachineState: machineState,
    onboardedOnEntry: false,
    currentStep: "restore-recover-backup",
    seedPath: null,
    pastRecover: false,
    recoverAvailable: true,
    checksPaused: false,
    genuineFailureKind: null,
    deviceNotGenuine: false,
    firmwareVersion: "1.8.0",
    availableFirmwareVersion: null,
    firmwareDeclined: false,
    returnsWithoutUpdate: 0,
    reportsRecoveryKey: true,
    device,
    connectionError: null,
    suspendSheets: false,
    reconnect: jest.fn(),
    send: jest.fn(),
    onQuit: jest.fn(),
  };
}

type InputWithoutDismissal = Omit<UnseededFunnelInput, "restoreDismissal">;

/** Owns the restore dismissal, as the funnel view model does. */
function useFunnelOf(funnelInput: InputWithoutDismissal) {
  const restoreDismissal = useRestoreDismissal(funnelInput.machineState);
  return useUnseededFunnelViewModel({ ...funnelInput, restoreDismissal });
}

function useFunnel(machineState: string) {
  return useFunnelOf(input(machineState));
}

function setupOf(model: ReturnType<typeof useUnseededFunnelViewModel>) {
  if (model?.status !== "setup") throw new Error(`expected setup, got ${model?.status}`);
  return model.setup;
}

describe("useUnseededFunnelViewModel", () => {
  it("should show Recover restore while the device is on that step", () => {
    const { result } = renderHook(() => useFunnel("deviceSetup.restoreRecover"));

    expect(result.current?.status).toBe("recoverRestore");
  });

  it("should show the restore choice after close, and the Recover screen again after the device leaves", () => {
    let machineState = "deviceSetup.restoreRecover";
    const { result, rerender } = renderHook(() => useFunnel(machineState));

    act(() => {
      if (result.current?.status !== "recoverRestore") throw new Error(result.current?.status);
      result.current.dismiss();
    });

    expect(result.current?.status).toBe("setup");
    if (result.current?.status !== "setup") throw new Error("expected setup");
    expect(result.current.setup.stage).toEqual({
      index: 4,
      total: 5,
      kind: "restore",
      indicator: "none",
      infoCard: "restoreChoice",
    });

    machineState = "deviceSetup.restoreWords";
    rerender(undefined);
    expect(result.current?.status).toBe("setup");

    machineState = "deviceSetup.restoreRecover";
    rerender(undefined);
    expect(result.current?.status).toBe("recoverRestore");
  });

  it("should report the restore choice as the visible state once Recover restore is closed", () => {
    const { result } = renderHook(() => useRestoreDismissal("deviceSetup.restoreRecover"));

    expect(result.current.visibleState).toBe("deviceSetup.restoreRecover");
    act(() => result.current.dismiss());

    expect(result.current.visibleState).toBe("deviceSetup.restoreChoice");
  });

  describe("on a Nano that updates its OS after setup", () => {
    const nanoX = {
      ...device,
      deviceName: "Ledger Nano X",
      modelId: DeviceModelId.nanoX,
    } as Device;

    function nanoInput(
      machineState: string,
      overrides: Partial<InputWithoutDismissal> = {},
    ): InputWithoutDismissal {
      return {
        ...input(machineState),
        device: nanoX,
        currentStep: null,
        firmwareVersion: "2.4.0",
        updateAfterSetup: true,
        seeded: false,
        ...overrides,
      };
    }

    it("should show the genuine check as the first of five steps", () => {
      const { result } = renderHook(() => useFunnelOf(nanoInput("checks.genuineCheck.running")));

      expect(setupOf(result.current).stage).toMatchObject({ kind: "genuine", index: 0, total: 5 });
    });

    it("should show the held-back OS check as the fifth step once seeded", () => {
      const { result } = renderHook(() =>
        useFunnelOf(
          nanoInput("postSetupFirmware.firmwareUpdateOffered", {
            seeded: true,
            availableFirmwareVersion: "2.8.0",
          }),
        ),
      );

      const setup = setupOf(result.current);
      expect(setup.stage).toMatchObject({ kind: "osCheck", index: 4, total: 5 });
      expect(setup.checks).toMatchObject({
        state: "updating",
        update: { current: "2.4.0", available: "2.8.0" },
      });
    });

    it("should keep five steps after the update moved the OS out of the held-back range", () => {
      let overrides: Partial<InputWithoutDismissal> = { seeded: true };
      const { result, rerender } = renderHook(() =>
        useFunnelOf(nanoInput("postSetupFirmware.firmwareCheck", overrides)),
      );

      overrides = { seeded: true, updateAfterSetup: false, firmwareVersion: "2.8.0" };
      rerender(undefined);

      expect(setupOf(result.current).stage).toMatchObject({ kind: "osCheck", index: 4, total: 5 });
    });

    it("should keep the OS check while the updated device reboots and reconnects", () => {
      let machineState = "postSetupFirmware.firmwareUpdateDelegated";
      const { result, rerender } = renderHook(() =>
        useFunnelOf(nanoInput(machineState, { seeded: true })),
      );

      for (const state of ["awaitingSessionAfterFirmwareUpdate", "readingState", "routing"]) {
        machineState = state;
        rerender(undefined);
        expect(setupOf(result.current).stage).toMatchObject({ kind: "osCheck", index: 4 });
      }
    });

    it("should not hold a stage while a touchscreen waits for its updated device", () => {
      const { result } = renderHook(() =>
        useFunnelOf({
          ...input("awaitingSessionAfterFirmwareUpdate"),
          seeded: true,
        }),
      );

      expect(result.current).toBeNull();
    });

    it("should skip a failed OS check after setup", () => {
      const send = jest.fn();
      const { result } = renderHook(() =>
        useFunnelOf(nanoInput("postSetupFirmware.firmwareCheckFailed", { seeded: true, send })),
      );

      setupOf(result.current).checks?.onSkipFirmwareCheck?.();

      expect(send).toHaveBeenCalledWith({ type: "SKIP" });
    });

    it("should not offer to skip a failed check before setup", () => {
      const { result } = renderHook(() => useFunnelOf(nanoInput("checks.firmwareCheckFailed")));

      expect(setupOf(result.current).checks?.onSkipFirmwareCheck).toBeUndefined();
    });
  });
});
