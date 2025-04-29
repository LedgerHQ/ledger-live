import { track } from "~/analytics";
import type { StorageType } from "LLM/storage/types";
import type { StorageMigrationUserEvent, StorageMigrationUserProps } from "./types";
import storage from "LLM/storage";
import { MIGRATION_STATUS } from "../constants";
import { STORAGE_TYPE } from "LLM/storage/constants";

const TRACK_EVENT_NAME = "StorageMigration";

export function trackStorageMigration(migrateFrom: StorageType) {
  const state = storage.getState();
  const { migrationStatus, rollbackStatus, numberOfReadErrors, lastError } = state;

  const trackData: StorageMigrationUserEvent = {
    from: migrateFrom,
    to: migrateFrom === STORAGE_TYPE.ASYNC_STORAGE ? STORAGE_TYPE.ASYNC_STORAGE : STORAGE_TYPE.MMKV,
    migrationStatus,
    rollbackStatus,
    errors: {
      count: numberOfReadErrors,
      ...lastError,
    },
    dateTime: new Date(),
  };

  track(TRACK_EVENT_NAME, { ...trackData });
}

export function getMigrationUserProps(): StorageMigrationUserProps {
  const state = storage.getState();
  const { migrationStatus, numberOfReadErrors } = state;

  return {
    hasRolledBack: migrationStatus === MIGRATION_STATUS.ROLLED_BACK ? "Yes" : "No",
    hasMigrated: migrationStatus === MIGRATION_STATUS.COMPLETED ? "Yes" : "No",
    useMMKV: state.storageType === "MMKV" ? "Yes" : "No",
    numberOfReadErrors,
  };
}
