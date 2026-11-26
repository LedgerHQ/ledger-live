import type { NativeScrollEvent } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { getNextScrollCompaction, type ScrollCompactionTracking } from "@shared/scroll-compaction";
import {
  acknowledgeTabBarCompact,
  tabBarCompactOnUI,
  tabBarResetGenerationOnUI,
} from "./tabBarDensityStore";

export function updateTabBarDensityOnUI(
  tracking: SharedValue<ScrollCompactionTracking>,
  event: Pick<NativeScrollEvent, "contentOffset" | "contentSize" | "layoutMeasurement">,
) {
  "worklet";
  const resetGeneration = tabBarResetGenerationOnUI.value;
  const { isCompact, ...nextTracking } = getNextScrollCompaction(tracking.value, {
    offset: event.contentOffset.y,
    maxOffset: event.contentSize.height - event.layoutMeasurement.height,
    isCompact: tabBarCompactOnUI.value,
    resetGeneration,
  });
  tracking.value = nextTracking;
  if (isCompact !== tabBarCompactOnUI.value) {
    tabBarCompactOnUI.value = isCompact;
    scheduleOnRN(acknowledgeTabBarCompact, isCompact, resetGeneration);
  }
}
