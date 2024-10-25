import AsyncStorage from "@react-native-async-storage/async-storage";
import { Web3HubDB } from "LLM/features/Web3Hub/types";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { DISSMISSED_MANIFETS_KEY, RECENTLY_USED_KEY } from "./constants";

const emptyRecentlyUsed: Web3HubDB["recentlyUsed"] = [];
export const recentlyUseAtom = storedAtom(RECENTLY_USED_KEY, emptyRecentlyUsed);

const emptyDismissedManifests: Web3HubDB["dismissedManifests"] = {};
export const dismissedManifestsAtom = storedAtom(DISSMISSED_MANIFETS_KEY, emptyDismissedManifests);

export function storedAtom<T = unknown>(key: string, defaultValue: T) {
  const storage = createJSONStorage<T>(() => AsyncStorage);
  return atomWithStorage<T>(key, defaultValue, storage);
}
