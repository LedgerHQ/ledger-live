import { useFeature } from "@features/platform-feature-flags";
import type { PlatformServicesConfig } from "../types.internals";

export function usePlatformServicesConfig(): PlatformServicesConfig {
  const perps = useFeature("ptxPerpsLiveAppMobile");
  const borrow = useFeature("ptxBorrowLiveApp");
  const predictions = useFeature("ptxPredictionsLiveAppMobile");

  return {
    availability: {
      perps: perps?.enabled ?? false,
      borrow: borrow?.enabled ?? false,
      predictions: predictions?.enabled ?? false,
    },
  };
}
