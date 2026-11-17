// oxlint-disable typescript/consistent-type-assertions
import {
  DeviceModelId,
  type ConnectedDevice,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import type { Backup } from "@ledgerhq/dmk-ledger-wallet";
import { mockOsUpdate } from "@domain/entity-device-os-update/schema.mock";
import type { DeviceBackupStorage } from "../../types/DeviceBackupStorage";
import type { ResolveOsUpdatesInput } from "../../types/ResolveOsUpdates";
import { executeResolveOsUpdatePath } from "./executeResolveOsUpdatePath";
import { ResolveOsUpdatesUseCase } from "./ResolveOsUpdatesUseCase";

jest.mock("./executeResolveOsUpdatePath");

const resolveOsUpdates = (input: ResolveOsUpdatesInput) =>
  new ResolveOsUpdatesUseCase().execute(input);

const mockExecute = jest.fn();
const listConnectedDevices = jest.fn();
const dmk = { listConnectedDevices } as unknown as DeviceManagementKit;
const backupStorage: DeviceBackupStorage = {
  getBackup: jest.fn(),
  saveBackup: jest.fn(),
  removeBackup: jest.fn(),
};
const backup: Backup = {
  languageId: 0,
  installedApps: [{ appName: "Bitcoin", data: undefined }],
  clsHexImage: undefined,
  createdAt: new Date(),
};
const osUpdate = mockOsUpdate();

const input = (overrides: Partial<ResolveOsUpdatesInput> = {}): ResolveOsUpdatesInput => ({
  dmk,
  backupStorage,
  modelId: DeviceModelId.STAX,
  wired: true,
  osVersion: "1.5.0",
  isBootloader: false,
  ...overrides,
});

describe("ResolveOsUpdatesUseCase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(executeResolveOsUpdatePath).mockImplementation(mockExecute);
    listConnectedDevices.mockReturnValue([
      { sessionId: "session-1", type: "USB" } as ConnectedDevice,
    ]);
    mockExecute.mockResolvedValue([osUpdate]);
    jest.mocked(backupStorage.getBackup).mockResolvedValue(undefined);
  });

  it("resolves the update path on the session of the device", async () => {
    await expect(resolveOsUpdates(input())).resolves.toEqual({
      osUpdates: [osUpdate],
      hasBackup: false,
    });
    expect(mockExecute).toHaveBeenCalledWith({ dmk, sessionId: "session-1" });
  });

  it("tells that a backup of the device model waits to be restored", async () => {
    jest.mocked(backupStorage.getBackup).mockResolvedValue(backup);

    await expect(resolveOsUpdates(input())).resolves.toMatchObject({ hasBackup: true });
    expect(backupStorage.getBackup).toHaveBeenCalledWith(DeviceModelId.STAX);
  });

  it.each([
    ["the device is in bootloader mode", { isBootloader: true }],
    ["the OS version is not supported", { osVersion: "0.9.0" }],
    ["the model has no Bluetooth", { modelId: DeviceModelId.NANO_SP, wired: false }],
  ])("resolves no update when %s, but still checks the backup", async (_label, overrides) => {
    jest.mocked(backupStorage.getBackup).mockResolvedValue(backup);

    await expect(resolveOsUpdates(input(overrides))).resolves.toEqual({
      osUpdates: [],
      hasBackup: true,
    });
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("resolves no update without a session on the connection", async () => {
    listConnectedDevices.mockReturnValue([]);

    await expect(resolveOsUpdates(input())).resolves.toMatchObject({ osUpdates: [] });
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("never fails: a resolve or storage error gives no update and no backup", async () => {
    mockExecute.mockRejectedValue(new Error("device locked"));
    jest.mocked(backupStorage.getBackup).mockRejectedValue(new Error("storage"));

    await expect(resolveOsUpdates(input())).resolves.toEqual({ osUpdates: [], hasBackup: false });
  });
});
