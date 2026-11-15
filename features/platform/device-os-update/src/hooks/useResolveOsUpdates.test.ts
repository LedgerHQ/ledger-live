/**
 * @jest-environment jsdom
 */
// oxlint-disable typescript/consistent-type-assertions
import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { renderHook, waitFor } from "@testing-library/react";
import { DeviceModelId, type DeviceManagementKit } from "@ledgerhq/device-management-kit";
import deviceOsUpdate from "@domain/entity-device-os-update";
import { mockOsUpdate } from "@domain/entity-device-os-update/schema.mock";
import { executeResolveOsUpdatePath } from "../use-cases/ResolveOsUpdatesUseCase/executeResolveOsUpdatePath";
import { ResolveOsUpdatesUseCase } from "../use-cases/ResolveOsUpdatesUseCase/ResolveOsUpdatesUseCase";
import type { DeviceBackupStorage } from "../types/DeviceBackupStorage";
import { useResolveOsUpdates, type UseResolveOsUpdatesParams } from "./useResolveOsUpdates";

jest.mock("../use-cases/ResolveOsUpdatesUseCase/executeResolveOsUpdatePath");

const mockExecute = jest.fn();
const listConnectedDevices = jest.fn();
const dmk = { listConnectedDevices } as unknown as DeviceManagementKit;
const backupStorage: DeviceBackupStorage = {
  getBackup: jest.fn(),
  saveBackup: jest.fn(),
  removeBackup: jest.fn(),
};
const osUpdate = mockOsUpdate();
const usbSession = { sessionId: "session-1", type: "USB" };

function render(params: Partial<UseResolveOsUpdatesParams> = {}) {
  const store = configureStore({ reducer: { deviceOsUpdate } });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(Provider, { store } as React.ComponentProps<typeof Provider>, children);
  const hook = renderHook(
    () =>
      useResolveOsUpdates({
        enabled: true,
        ready: true,
        dmk,
        backupStorage,
        device: { modelId: DeviceModelId.STAX, wired: true },
        deviceInfo: { version: "1.5.0", isBootloader: false },
        ...params,
      }),
    { wrapper },
  );
  return { ...hook, store };
}

describe("useResolveOsUpdates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(executeResolveOsUpdatePath).mockImplementation(mockExecute);
    listConnectedDevices.mockReturnValue([usbSession]);
    mockExecute.mockResolvedValue([osUpdate]);
    jest.mocked(backupStorage.getBackup).mockResolvedValue(undefined);
  });

  it("stores the resolved updates and stops resolving", async () => {
    const { result, store } = render();

    expect(result.current).toBe(true);
    await waitFor(() => expect(result.current).toBe(false));

    expect(mockExecute).toHaveBeenCalledWith({ dmk, sessionId: "session-1" });
    expect(store.getState().deviceOsUpdate.osUpdates).toEqual([osUpdate]);
  });

  it("looks the session up on the connection of the device", async () => {
    listConnectedDevices.mockReturnValue([usbSession, { sessionId: "session-2", type: "BLE" }]);
    const { result } = render({ device: { modelId: DeviceModelId.STAX, wired: false } });

    await waitFor(() => expect(result.current).toBe(false));

    expect(mockExecute).toHaveBeenCalledWith({ dmk, sessionId: "session-2" });
  });

  it("does nothing while the device is not ready", () => {
    const { result, store } = render({ ready: false });

    expect(result.current).toBe(false);
    expect(mockExecute).not.toHaveBeenCalled();
    expect(store.getState().deviceOsUpdate.osUpdates).toEqual([]);
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

    expect(store.getState().deviceOsUpdate.osUpdates).toEqual([]);
  });

  it("settles with no update when the lookup of the connected device throws", async () => {
    listConnectedDevices.mockImplementation(() => {
      throw new Error("unexpected");
    });
    const { result, store } = render();

    await waitFor(() => expect(result.current).toBe(false));

    expect(mockExecute).not.toHaveBeenCalled();
    expect(store.getState().deviceOsUpdate.osUpdates).toEqual([]);
  });

  it("stores no update when no session is open on the connection", async () => {
    listConnectedDevices.mockReturnValue([]);
    const { result, store } = render();

    await waitFor(() => expect(result.current).toBe(false));

    expect(mockExecute).not.toHaveBeenCalled();
    expect(store.getState().deviceOsUpdate.osUpdates).toEqual([]);
  });

  it.each([
    ["an unsupported version", { deviceInfo: { version: "0.9.0", isBootloader: false } }],
    ["a device in bootloader mode", { deviceInfo: { version: "1.5.0", isBootloader: true } }],
    [
      "a model without Bluetooth over BLE",
      { device: { modelId: DeviceModelId.NANO_SP, wired: false } },
    ],
  ])("skips the resolve for %s", async (_label, params) => {
    const { result, store } = render(params);

    await waitFor(() => expect(result.current).toBe(false));

    expect(mockExecute).not.toHaveBeenCalled();
    expect(store.getState().deviceOsUpdate.osUpdates).toEqual([]);
  });

  describe("backup", () => {
    const backup = {
      languageId: 0,
      installedApps: [{ appName: "Bitcoin", data: undefined }],
      clsHexImage: undefined,
      createdAt: new Date(),
    };

    it("stores that a backup of the device model is waiting to be restored", async () => {
      mockExecute.mockResolvedValue([]);
      jest.mocked(backupStorage.getBackup).mockResolvedValue(backup);
      const { result, store } = render();

      await waitFor(() => expect(result.current).toBe(false));

      expect(backupStorage.getBackup).toHaveBeenCalledWith(DeviceModelId.STAX);
      expect(store.getState().deviceOsUpdate.hasBackup).toBe(true);
    });

    it("ignores a backup with nothing to restore", async () => {
      jest.mocked(backupStorage.getBackup).mockResolvedValue({ ...backup, installedApps: [] });
      const { result, store } = render();

      await waitFor(() => expect(result.current).toBe(false));

      expect(store.getState().deviceOsUpdate.hasBackup).toBe(false);
    });

    it("still looks for the backup when the OS update path cannot be resolved", async () => {
      jest.mocked(backupStorage.getBackup).mockResolvedValue(backup);
      const { result, store } = render({ deviceInfo: { version: "1.5.0", isBootloader: true } });

      await waitFor(() => expect(result.current).toBe(false));

      expect(store.getState().deviceOsUpdate.hasBackup).toBe(true);
    });

    it("stores no backup when the storage fails", async () => {
      jest.mocked(backupStorage.getBackup).mockRejectedValue(new Error("storage"));
      const { result, store } = render();

      await waitFor(() => expect(result.current).toBe(false));

      expect(store.getState().deviceOsUpdate.hasBackup).toBe(false);
    });
  });

  it("stops resolving without storing anything when the resolution fails", async () => {
    const execute = jest
      .spyOn(ResolveOsUpdatesUseCase.prototype, "execute")
      .mockRejectedValue(new Error("unexpected"));
    const { result, store } = render();

    await waitFor(() => expect(result.current).toBe(false));

    expect(store.getState().deviceOsUpdate.osUpdates).toEqual([]);
    execute.mockRestore();
  });
});
