import { useMemo } from "react";
import type { NightlyLayerViewModelResult } from "./types";
import { getWatermarkPositions } from "./utils/getWatermarkPositions";
import { shouldShowNightlyLayer } from "./utils/shouldShowNightlyLayer";

export function useNightlyLayerViewModel(): NightlyLayerViewModelResult {
  const isVisible = shouldShowNightlyLayer(__PRERELEASE__, __CHANNEL__);
  const watermarks = useMemo(() => (isVisible ? getWatermarkPositions() : []), [isVisible]);

  return {
    isVisible,
    appVersion: __APP_VERSION__,
    watermarks,
  };
}
