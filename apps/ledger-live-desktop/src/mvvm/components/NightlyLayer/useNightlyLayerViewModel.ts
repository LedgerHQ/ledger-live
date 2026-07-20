import { useMemo } from "react";
import type { NightlyLayerViewModelResult } from "./types";
import { getWatermarkPositions } from "./utils/getWatermarkPositions";

function shouldShowNightlyLayer(): boolean {
  return __PRERELEASE__ && __CHANNEL__ !== "next" && !__CHANNEL__.includes("sha");
}

export function useNightlyLayerViewModel(): NightlyLayerViewModelResult {
  const watermarks = useMemo(() => getWatermarkPositions(), []);

  return {
    isVisible: shouldShowNightlyLayer(),
    appVersion: __APP_VERSION__,
    watermarks,
  };
}
