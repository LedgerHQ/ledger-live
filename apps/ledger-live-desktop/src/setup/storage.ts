import type { ConfigStorage } from "@shared/app-config";

const STORAGE_KEY = "appConfigSelections";

/**
 * The saved selections for a write: unreadable ones count as none, so the write replaces them.
 * `getAll` stays strict, since `resolveAppConfig` clears unreadable selections at boot.
 */
const readSelections = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") ?? {};
  } catch {
    return {};
  }
};

export const appConfigStorage: ConfigStorage = {
  getAll: () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"),
  clear: () => localStorage.removeItem(STORAGE_KEY),
  set: (key, value) =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readSelections(), [key]: value })),
  remove: key => {
    const selections = readSelections();
    delete selections[key];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
  },
};
