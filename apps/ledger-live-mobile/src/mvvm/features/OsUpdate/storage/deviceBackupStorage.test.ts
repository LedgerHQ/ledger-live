import storage from "LLM/storage";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { DeviceBackupStorage } from "@ledgerhq/live-dmk-shared";
import { deviceBackupStorage } from "./deviceBackupStorage";

jest.mock("LLM/storage", () => ({
  __esModule: true,
  default: { getString: jest.fn(), saveString: jest.fn(), delete: jest.fn() },
}));

const store = storage as unknown as {
  getString: jest.Mock;
  saveString: jest.Mock;
  delete: jest.Mock;
};

type Backup = Parameters<DeviceBackupStorage["saveBackup"]>[1];

const backup: Backup = {
  languageId: 1,
  installedApps: [{ appName: "Bitcoin", data: "0xabcd" }],
  clsHexImage: "0x1234",
  createdAt: new Date("2026-01-02T03:04:05.000Z"),
};

const keyOf = (modelId: DeviceModelId) => `osUpdates.backup.${modelId}`;

describe("deviceBackupStorage", () => {
  let data: Map<string, string>;

  beforeEach(() => {
    data = new Map();
    store.getString.mockImplementation(async (key: string) => data.get(key) ?? null);
    store.saveString.mockImplementation(async (key: string, value: string) => {
      data.set(key, value);
    });
    store.delete.mockImplementation(async (key: string) => {
      data.delete(key);
    });
  });

  it("returns undefined when nothing was saved", async () => {
    await expect(deviceBackupStorage.getBackup(DeviceModelId.STAX)).resolves.toBe(undefined);
  });

  it("round trips a backup, restoring createdAt as a Date", async () => {
    await deviceBackupStorage.saveBackup(DeviceModelId.STAX, backup);

    const restored = await deviceBackupStorage.getBackup(DeviceModelId.STAX);

    expect(restored).toEqual(backup);
    expect(restored?.createdAt).toBeInstanceOf(Date);
  });

  it("keeps one backup per device model", async () => {
    await deviceBackupStorage.saveBackup(DeviceModelId.STAX, backup);

    await expect(deviceBackupStorage.getBackup(DeviceModelId.FLEX)).resolves.toBe(undefined);
  });

  it("overwrites the previous backup of the same model", async () => {
    const newer = { ...backup, languageId: undefined, createdAt: new Date("2026-02-01T00:00:00Z") };
    await deviceBackupStorage.saveBackup(DeviceModelId.STAX, backup);
    await deviceBackupStorage.saveBackup(DeviceModelId.STAX, newer);

    await expect(deviceBackupStorage.getBackup(DeviceModelId.STAX)).resolves.toEqual(newer);
  });

  it("removes a backup", async () => {
    await deviceBackupStorage.saveBackup(DeviceModelId.STAX, backup);

    await deviceBackupStorage.removeBackup(DeviceModelId.STAX);

    await expect(deviceBackupStorage.getBackup(DeviceModelId.STAX)).resolves.toBe(undefined);
  });

  it.each([
    ["invalid JSON", "{not json"],
    ["a JSON value that is not a backup", JSON.stringify({ foo: "bar" })],
    ["an invalid creation date", JSON.stringify({ installedApps: [], createdAt: "not-a-date" })],
    [
      "a null installed app",
      JSON.stringify({ installedApps: [null], createdAt: "2026-01-02T03:04:05.000Z" }),
    ],
    [
      "an installed app without a name",
      JSON.stringify({
        installedApps: [{ data: "0xabcd" }],
        createdAt: "2026-01-02T03:04:05.000Z",
      }),
    ],
  ])("treats %s as no backup instead of throwing", async (_label, raw) => {
    data.set(keyOf(DeviceModelId.STAX), raw);

    await expect(deviceBackupStorage.getBackup(DeviceModelId.STAX)).resolves.toBe(undefined);
  });
});
