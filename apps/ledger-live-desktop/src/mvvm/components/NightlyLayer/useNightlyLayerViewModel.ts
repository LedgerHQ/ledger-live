import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { hideNightlyLayerSelector } from "~/renderer/reducers/settings";
import type { NightlyLayerViewModelResult } from "./types";
import { getWatermarkPositions } from "./utils/getWatermarkPositions";
import { shouldShowNightlyLayer } from "./utils/shouldShowNightlyLayer";

export function useNightlyLayerViewModel(): NightlyLayerViewModelResult {
  const hideNightlyLayer = useSelector(hideNightlyLayerSelector);
  const isVisible = shouldShowNightlyLayer(__PRERELEASE__, __CHANNEL__) && !hideNightlyLayer;
  const watermarks = useMemo(() => (isVisible ? getWatermarkPositions() : []), [isVisible]);

  return {
    isVisible,
    appVersion: __APP_VERSION__,
    watermarks,
  };
}
