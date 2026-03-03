import { Web3HubDB } from "LLM/features/Web3Hub/types";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { DISSMISSED_MANIFETS_KEY, RECENTLY_USED_KEY } from "./constants";
import deviceStorage from "LLM/storage";

const emptyDismissedManifests: Web3HubDB["dismissedManifests"] = {};
export const dismissedManifestsAtom = storedAtom(DISSMISSED_MANIFETS_KEY, emptyDismissedManifests);

const emptyRecentlyUsed: Web3HubDB["recentlyUsed"] = [];
export const recentlyUsedAtom = storedAtom(RECENTLY_USED_KEY, emptyRecentlyUsed);

export function storedAtom<T = unknown>(key: string, defaultValue: T) {
  const storage = createJSONStorage<T>(() => ({
    getItem: async key => {
      try {
        const value = await deviceStorage.getString(key);
        return value != null ? JSON.parse(value) : null;
      } catch (error) {
        console.error(`Failed to parse JSON for key "${key}":`, error);
        return null;
      }
    },
    setItem: async (key, value) => {
      try {
        const stringValue = JSON.stringify(value);
        await deviceStorage.saveString(key, stringValue);
      } catch (error) {
        console.error(`Failed to stringify JSON for key "${key}":`, error);
      }
    },
    removeItem: key => deviceStorage.delete(key),
  }));

  return atomWithStorage<T>(key, defaultValue, storage);
}
