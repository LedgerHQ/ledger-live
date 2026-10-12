import { useEffect } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { BASIC_REFETCH, REFETCH_TIME_ONE_MINUTE } from "@ledgerhq/live-common/market/utils/timers";
import type { HashMapBody } from "@ledgerhq/live-common/market/utils/types";
import { isDataStale } from "../../utils";

type Params = {
  cachedMetadataMap: Map<string, HashMapBody>;
  visiblePage: number;
  enabled: boolean;
};

export function useMarketAssetsRefresh({ cachedMetadataMap, visiblePage, enabled }: Params) {
  const refreshTime = Number(useFeature("llmRefreshMarketData")?.params?.refreshTime);
  const refreshRate = REFETCH_TIME_ONE_MINUTE * (refreshTime > 0 ? refreshTime : BASIC_REFETCH);

  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      const visiblePageMetadata = cachedMetadataMap.get(String(visiblePage - 1));
      if (visiblePageMetadata && isDataStale(visiblePageMetadata.updatedAt, refreshRate)) {
        visiblePageMetadata.refetch();
      }
    }, refreshRate);

    return () => clearInterval(intervalId);
  }, [cachedMetadataMap, enabled, refreshRate, visiblePage]);
}
