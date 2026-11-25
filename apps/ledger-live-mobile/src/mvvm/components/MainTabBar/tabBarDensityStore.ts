import { useSyncExternalStore } from "react";
import { makeMutable } from "react-native-reanimated";

type Listener = () => void;

const listeners = new Set<Listener>();
let isCompact = false;

export const tabBarCompactOnUI = makeMutable(false);

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getIsTabBarCompact = () => isCompact;

export function setTabBarCompact(next: boolean) {
  tabBarCompactOnUI.value = next;
  if (next === isCompact) return;
  isCompact = next;
  listeners.forEach(listener => listener());
}

export const resetTabBarDensity = () => setTabBarCompact(false);

export const useIsTabBarCompact = () => useSyncExternalStore(subscribe, getIsTabBarCompact);
