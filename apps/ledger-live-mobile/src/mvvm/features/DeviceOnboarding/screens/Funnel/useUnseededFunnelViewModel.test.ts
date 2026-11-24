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

/** Owns the restore dismissal, as the funnel view model does. */
function useFunnel(machineState: string) {
  const restoreDismissal = useRestoreDismissal(machineState);
  return useUnseededFunnelViewModel({ ...input(machineState), restoreDismissal });
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
});
