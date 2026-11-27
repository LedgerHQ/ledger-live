import { useSyncExternalStore } from "react";
import { makeMutable } from "react-native-reanimated";
import { createScrollCompactionStore } from "@shared/scroll-compaction";

export const tabBarCompactOnUI = makeMutable(false);
export const tabBarResetGenerationOnUI = makeMutable(0);

export const tabBarDensity = createScrollCompactionStore({
  onApply: isCompact => {
    tabBarCompactOnUI.value = isCompact;
  },
  onReset: resetGeneration => {
    tabBarResetGenerationOnUI.value = resetGeneration;
  },
});

export const {
  getIsCompact: getIsTabBarCompact,
  setCompact: setTabBarCompact,
  acknowledgeCompact: acknowledgeTabBarCompact,
  reset: resetTabBarDensity,
} = tabBarDensity;

export const useIsTabBarCompact = () =>
  useSyncExternalStore(tabBarDensity.subscribe, tabBarDensity.getIsCompact);
