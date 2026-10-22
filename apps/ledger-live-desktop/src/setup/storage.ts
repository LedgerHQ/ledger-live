import type { ConfigStorage } from "@shared/app-config";

const STORAGE_KEY = "appConfigSelections";
export const appConfigStorage: ConfigStorage = {
  getAll: () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"),
  clear: () => localStorage.removeItem(STORAGE_KEY),
  set: (key, value) =>
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"),
        [key]: value,
      }),
    ),
};
