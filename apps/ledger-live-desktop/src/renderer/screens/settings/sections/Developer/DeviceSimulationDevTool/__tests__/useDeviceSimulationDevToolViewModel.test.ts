import { DeviceModelId } from "@ledgerhq/devices";
import { act, renderHook } from "tests/testSetup";
import { useDeviceSimulationDevToolViewModel } from "../useDeviceSimulationDevToolViewModel";

describe("useDeviceSimulationDevToolViewModel", () => {
  it("should expose empty device history by default", () => {
    const { result } = renderHook(() => useDeviceSimulationDevToolViewModel());

    expect(result.current.devicesModelList).toEqual([]);
    expect(result.current.currentHistoryLabels).toEqual([]);
    expect(result.current.isResetEnabled).toBe(false);
  });

  it("should add a device model when toggled on", () => {
    const { result, store } = renderHook(() => useDeviceSimulationDevToolViewModel());

    act(() => {
      result.current.toggleDevice(DeviceModelId.nanoS, true);
    });

    expect(store.getState().settings.devicesModelList).toEqual([DeviceModelId.nanoS]);
    expect(result.current.isDeviceSeen(DeviceModelId.nanoS)).toBe(true);
    expect(result.current.currentHistoryLabels).toEqual(["nanoS"]);
    expect(result.current.isResetEnabled).toBe(true);
  });

  it("should remove a device model when toggled off", () => {
    const { result, store } = renderHook(() => useDeviceSimulationDevToolViewModel(), {
      initialState: {
        settings: {
          devicesModelList: [DeviceModelId.nanoS, DeviceModelId.nanoX],
        },
      },
    });

    act(() => {
      result.current.toggleDevice(DeviceModelId.nanoS, false);
    });

    expect(store.getState().settings.devicesModelList).toEqual([DeviceModelId.nanoX]);
    expect(result.current.currentHistoryLabels).toEqual(["nanoX"]);
  });

  it("should not duplicate a device model when toggled on twice", () => {
    const { result, store } = renderHook(() => useDeviceSimulationDevToolViewModel(), {
      initialState: {
        settings: {
          devicesModelList: [DeviceModelId.nanoS],
        },
      },
    });

    act(() => {
      result.current.toggleDevice(DeviceModelId.nanoS, true);
    });

    expect(store.getState().settings.devicesModelList).toEqual([DeviceModelId.nanoS]);
  });

  it("should clear device history on reset", () => {
    const { result, store } = renderHook(() => useDeviceSimulationDevToolViewModel(), {
      initialState: {
        settings: {
          devicesModelList: [DeviceModelId.nanoS, DeviceModelId.stax],
        },
      },
    });

    act(() => {
      result.current.resetDevices();
    });

    expect(store.getState().settings.devicesModelList).toEqual([]);
    expect(result.current.currentHistoryLabels).toEqual([]);
    expect(result.current.isResetEnabled).toBe(false);
  });
});
