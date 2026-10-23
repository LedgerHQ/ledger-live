import { useFeature } from "@features/platform-feature-flags";
import type { ServicesAvailability } from "../types";

export function useServicesAvailability(): ServicesAvailability {
  const perps = useFeature("ptxPerpsLiveApp");
  const borrow = useFeature("ptxBorrowLiveApp");

  return {
    perps: perps?.enabled ?? false,
    borrow: borrow?.enabled ?? false,
  };
}
