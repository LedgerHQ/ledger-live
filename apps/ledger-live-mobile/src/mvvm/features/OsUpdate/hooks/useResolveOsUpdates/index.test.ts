import { DeviceModelId } from "@ledgerhq/devices";
import type { DeviceInfo } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { OsUpdate } from "@ledgerhq/live-dmk-shared";
import { renderHook, waitFor } from "@tests/test-renderer";
import { useResolveOsUpdates } from "./index";

const mockExecute = jest.fn();
const mockGetBackup = jest.fn();
const mockGetActiveConnectedDevice = jest.fn();
const mockDmk = { listConnectedDevices: jest.fn() };

jest.mock("@ledgerhq/live-dmk-mobile", () => ({
  useDeviceManagementKit: () => mockDmk,
  getActiveConnectedDevice: (...args: unknown[]) => mockGetActiveConnectedDevice(...args),
}));
jest.mock("../../storage/deviceBackupStorage", () => ({
  deviceBackupStorage: { getBackup: (...args: unknown[]) => mockGetBackup(...args) },
}));
jest.mock("@ledgerhq/live-dmk-shared", () => ({
  ...jest.requireActual("@ledgerhq/live-dmk-shared"),
  ResolveOsUpdatePathUseCase: jest.fn().mockImplementation(() => ({ execute: mockExecute })),
}));

const osUpdate = { finalFirmware: { version: "1.2.3" } } as OsUpdate;
const supportedDevice: Device = {
  deviceId: "usb|1",
  modelId: DeviceModelId.stax,
  wired: true,
};
const deviceInfo = { version: "1.5.0", isBootloader: false, isOSU: false } as DeviceInfo;

const render = (params: Partial<Parameters<typeof useResolveOsUpdates>[0]> = {}) =>
  renderHook(
    () =>
      useResolveOsUpdates({
        enabled: true,
        ready: true,
        device: supportedDevice,
        deviceInfo,
        ...params,
      }),
    {},
  );

describe("useResolveOsUpdates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetActiveConnectedDevice.mockReturnValue({ sessionId: "session-1" });
    mockExecute.mockResolvedValue([osUpdate]);
    mockGetBackup.mockResolvedValue(undefined);
  });

  it("stores the resolved updates and stops resolving", async () => {
    const { result, store } = render();

    expect(result.current).toBe(true);
    await waitFor(() => expect(result.current).toBe(false));

    expect(mockGetActiveConnectedDevice).toHaveBeenCalledWith(mockDmk, { wired: true });
    expect(mockExecute).toHaveBeenCalledWith({ dmk: mockDmk, sessionId: "session-1" });
    expect(store.getState().osUpdate.osUpdates).toEqual([osUpdate]);
  });

  it("resolves the updates of a device in OSU mode", async () => {
    const { result, store } = render({ deviceInfo: { ...deviceInfo, isOSU: true } });

    await waitFor(() => expect(result.current).toBe(false));

    expect(mockExecute).toHaveBeenCalledWith({ dmk: mockDmk, sessionId: "session-1" });
    expect(store.getState().osUpdate.osUpdates).toEqual([osUpdate]);
  });

  it("does nothing while the device is not ready", () => {
    const { result, store } = render({ ready: false });

    expect(result.current).toBe(false);
    expect(mockExecute).not.toHaveBeenCalled();
    expect(store.getState().osUpdate.osUpdates).toEqual([]);
  });

  it("does nothing when the feature is disabled", () => {
    const { result } = render({ enabled: false });

    expect(result.current).toBe(false);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("stores no update when the resolve fails", async () => {
    mockExecute.mockRejectedValue(new Error("device locked"));
    const { result, store } = render();

    await waitFor(() => expect(result.current).toBe(false));

    expect(store.getState().osUpdate.osUpdates).toEqual([]);
  });

  it("settles with no update when the lookup of the connected device throws", async () => {
    mockGetActiveConnectedDevice.mockImplementation(() => {
      throw new Error("unexpected");
    });
    const { result, store } = render();

    await waitFor(() => expect(result.current).toBe(false));

    expect(mockExecute).not.toHaveBeenCalled();
    expect(store.getState().osUpdate.osUpdates).toEqual([]);
  });

  it("stores no update when the connected device of the active session is not found", async () => {
    mockGetActiveConnectedDevice.mockReturnValue(undefined);
    const { result, store } = render();

    await waitFor(() => expect(result.current).toBe(false));

    expect(mockExecute).not.toHaveBeenCalled();
    expect(store.getState().osUpdate.osUpdates).toEqual([]);
  });

  it.each([
    ["an unsupported version", { deviceInfo: { ...deviceInfo, version: "0.9.0" } }],
    ["a device in bootloader mode", { deviceInfo: { ...deviceInfo, isBootloader: true } }],
    [
      "a model without Bluetooth over BLE",
      { device: { ...supportedDevice, modelId: DeviceModelId.nanoSP, wired: false } },
    ],
  ])("skips the resolve for %s", async (_label, params) => {
    const { result, store } = render(params);

    await waitFor(() => expect(result.current).toBe(false));

    expect(mockExecute).not.toHaveBeenCalled();
    expect(store.getState().osUpdate.osUpdates).toEqual([]);
  });

  describe("backup", () => {
    const backup = {
      languageId: 0,
      installedApps: [{ appName: "Bitcoin" }],
      createdAt: new Date(),
    };

    it("stores that a backup of the device model is waiting to be restored", async () => {
      mockExecute.mockResolvedValue([]);
      mockGetBackup.mockResolvedValue(backup);
      const { result, store } = render();

      await waitFor(() => expect(result.current).toBe(false));

      expect(mockGetBackup).toHaveBeenCalledWith("stax");
      expect(store.getState().osUpdate.hasBackup).toBe(true);
    });

    it("ignores a backup with nothing to restore", async () => {
      mockGetBackup.mockResolvedValue({ ...backup, installedApps: [] });
      const { result, store } = render();

      await waitFor(() => expect(result.current).toBe(false));

      expect(store.getState().osUpdate.hasBackup).toBe(false);
    });

    it("still looks for the backup when the OS update path cannot be resolved", async () => {
      mockGetBackup.mockResolvedValue(backup);
      const { result, store } = render({ deviceInfo: { ...deviceInfo, isBootloader: true } });

      await waitFor(() => expect(result.current).toBe(false));

      expect(store.getState().osUpdate.hasBackup).toBe(true);
    });

    it("stores no backup when the storage fails", async () => {
      mockGetBackup.mockRejectedValue(new Error("storage"));
      const { result, store } = render();

      await waitFor(() => expect(result.current).toBe(false));

      expect(store.getState().osUpdate.hasBackup).toBe(false);
    });
  });
});
