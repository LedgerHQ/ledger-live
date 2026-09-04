import { DeviceModelId } from "@ledgerhq/types-devices";
import { act, renderHook } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { useDeviceSimulationDevToolViewModel } from "../useDeviceSimulationDevToolViewModel";

const emptyKnownDeviceModelIds = {
  blue: false,
  nanoS: false,
  nanoSP: false,
  nanoX: false,
  stax: false,
  europa: false,
  apex: false,
};

const withSettings =
  (settings: Partial<State["settings"]>) =>
  (state: State): State => ({
    ...state,
    settings: {
      ...state.settings,
      ...settings,
    },
  });

describe("useDeviceSimulationDevToolViewModel", () => {
  it("should expose empty device history by default", () => {
    const { result } = renderHook(() => useDeviceSimulationDevToolViewModel(), {
      overrideInitialState: withSettings({
        knownDeviceModelIds: emptyKnownDeviceModelIds,
      }),
    });

    expect(result.current.currentHistoryLabels).toEqual([]);
    expect(result.current.isResetEnabled).toBe(false);
  });

  it("should add a device model when toggled on", () => {
    const { result, store } = renderHook(() => useDeviceSimulationDevToolViewModel(), {
      overrideInitialState: withSettings({
        knownDeviceModelIds: emptyKnownDeviceModelIds,
      }),
    });

    act(() => {
      result.current.toggleDevice(DeviceModelId.nanoS, true);
    });

    expect(store.getState().settings.knownDeviceModelIds.nanoS).toBe(true);
    expect(result.current.isDeviceSeen(DeviceModelId.nanoS)).toBe(true);
    expect(result.current.currentHistoryLabels).toEqual(["nanoS"]);
    expect(result.current.isResetEnabled).toBe(true);
  });

  it("should remove a device model when toggled off", () => {
    const { result, store } = renderHook(() => useDeviceSimulationDevToolViewModel(), {
      overrideInitialState: withSettings({
        knownDeviceModelIds: {
          ...emptyKnownDeviceModelIds,
          nanoS: true,
          nanoX: true,
        },
      }),
    });

    act(() => {
      result.current.toggleDevice(DeviceModelId.nanoS, false);
    });

    expect(store.getState().settings.knownDeviceModelIds.nanoS).toBe(false);
    expect(store.getState().settings.knownDeviceModelIds.nanoX).toBe(true);
    expect(result.current.currentHistoryLabels).toEqual(["nanoX"]);
  });

  it("should clear QA device history on reset", () => {
    const { result, store } = renderHook(() => useDeviceSimulationDevToolViewModel(), {
      overrideInitialState: withSettings({
        knownDeviceModelIds: {
          ...emptyKnownDeviceModelIds,
          nanoS: true,
          stax: true,
        },
      }),
    });

    act(() => {
      result.current.resetDevices();
    });

    expect(store.getState().settings.knownDeviceModelIds).toMatchObject({
      nanoS: false,
      nanoSP: false,
      nanoX: false,
      stax: false,
      europa: false,
      apex: false,
    });
    expect(result.current.currentHistoryLabels).toEqual([]);
    expect(result.current.isResetEnabled).toBe(false);
  });
});
