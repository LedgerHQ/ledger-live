import storage from "LLM/storage";
import type { DeviceBackupStorage } from "@ledgerhq/live-dmk-shared";

type Backup = NonNullable<Awaited<ReturnType<DeviceBackupStorage["getBackup"]>>>;

type StoredBackup = Omit<Backup, "createdAt"> & { createdAt: string };

const STORAGE_KEY_PREFIX = "osUpdates.backup.";

const storageKey = (deviceModelId: string) => `${STORAGE_KEY_PREFIX}${deviceModelId}`;

function isStoredApp(value: unknown): value is StoredBackup["installedApps"][number] {
  if (typeof value !== "object" || value === null) return false;
  const { appName, data } = value as Partial<StoredBackup["installedApps"][number]>;

  return typeof appName === "string" && (data === undefined || typeof data === "string");
}

function isStoredBackup(value: unknown): value is StoredBackup {
  if (typeof value !== "object" || value === null) return false;
  const { languageId, installedApps, clsHexImage, createdAt } = value as Partial<StoredBackup>;

  return (
    (languageId === undefined || typeof languageId === "number") &&
    Array.isArray(installedApps) &&
    installedApps.every(isStoredApp) &&
    (clsHexImage === undefined || typeof clsHexImage === "string") &&
    typeof createdAt === "string" &&
    !Number.isNaN(new Date(createdAt).getTime())
  );
}

function deserialize(raw: string): Backup | undefined {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredBackup(parsed)) return undefined;

    return { ...parsed, createdAt: new Date(parsed.createdAt) };
  } catch {
    return undefined;
  }
}

/**
 * Persists one backup per device model in the app storage, so that an interrupted OS update can
 * restore it after the app restarts. Unreadable data is treated as "no backup".
 */
export const deviceBackupStorage: DeviceBackupStorage = {
  async getBackup(deviceModelId) {
    const raw = await storage.getString(storageKey(deviceModelId));

    return raw === null ? undefined : deserialize(raw);
  },

  async saveBackup(deviceModelId, backup) {
    const stored: StoredBackup = { ...backup, createdAt: backup.createdAt.toISOString() };

    await storage.saveString(storageKey(deviceModelId), JSON.stringify(stored));
  },

  async removeBackup(deviceModelId) {
    await storage.delete(storageKey(deviceModelId));
  },
};
