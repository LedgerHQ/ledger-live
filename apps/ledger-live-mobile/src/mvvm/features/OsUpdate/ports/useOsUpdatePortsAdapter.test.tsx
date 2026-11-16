import { Linking } from "react-native";
import { DeviceModelId as DmkDeviceModelId } from "@ledgerhq/device-management-kit";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { act, renderHook } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { deviceBackupStorage } from "../storage/deviceBackupStorage";
import { useOsUpdatePortsAdapter } from "./useOsUpdatePortsAdapter";

const mockDmk = { listConnectedDevices: jest.fn() };
let mockHasDmk = true;

jest.mock("@ledgerhq/live-dmk-mobile", () => ({
  ...jest.requireActual("@ledgerhq/live-dmk-mobile"),
  useDeviceManagementKit: () => (mockHasDmk ? mockDmk : null),
}));

const withLastSeenFlex = (state: State): State => ({
  ...state,
  settings: {
    ...state.settings,
    seenDevices: [
      { modelId: DeviceModelId.europa, deviceInfo: { version: "1.4.0" } },
    ] as State["settings"]["seenDevices"],
  },
});

describe("useOsUpdatePortsAdapter", () => {
  beforeEach(() => {
    mockHasDmk = true;
  });

  it("gives no ports until the DMK is available", () => {
    mockHasDmk = false;

    const { result } = renderHook(() => useOsUpdatePortsAdapter());

    expect(result.current).toBeNull();
  });

  it("gives the app DMK and backup storage", () => {
    const { result } = renderHook(() => useOsUpdatePortsAdapter());

    expect(result.current?.dmk).toBe(mockDmk);
    expect(result.current?.backupStorage).toBe(deviceBackupStorage);
  });

  it("gives the OS version last seen on a device of the same model, matched across model ids", () => {
    const { result } = renderHook(() => useOsUpdatePortsAdapter(), {
      overrideInitialState: withLastSeenFlex,
    });

    expect(result.current?.getLastSeenOsVersion(DmkDeviceModelId.FLEX)).toBe("1.4.0");
    expect(result.current?.getLastSeenOsVersion(DmkDeviceModelId.STAX)).toBeUndefined();
  });

  it("opens Ledger support", () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { result } = renderHook(() => useOsUpdatePortsAdapter());

    act(() => result.current?.openSupport());

    expect(openURL).toHaveBeenCalledWith(expect.stringContaining("support.ledger.com"));
  });
});
