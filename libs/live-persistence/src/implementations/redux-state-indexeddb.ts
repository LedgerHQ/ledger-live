/**
 * Simple IndexedDB persistence for Redux state
 * No extra wrapper layers - just save/load JSON directly
 */

import { log } from "@ledgerhq/logs";
import type { PersistedRtkQueryState } from "../rtk-redux-persist";

const DB_NAME = "ledger-live-crypto-assets";
const STORE_NAME = "cache";
const STATE_KEY = "redux-state";
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
    request.onupgradeneeded = event => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function loadRtkQueryStateFromIndexedDB(): Promise<PersistedRtkQueryState | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(STATE_KEY);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        resolve((request.result as PersistedRtkQueryState | undefined) ?? null);
      };
    });
  } catch (error) {
    log("persistence", "Failed to load state from IndexedDB", error);
    return null;
  }
}

export async function saveRtkQueryStateToIndexedDB(
  state: PersistedRtkQueryState | null,
): Promise<void> {
  if (!state) return;

  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(state, STATE_KEY);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    log("persistence", "Failed to save state to IndexedDB", error);
  }
}

export async function clearRtkQueryStateFromIndexedDB(): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(STATE_KEY);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    log("persistence", "Failed to clear state from IndexedDB", error);
  }
}
