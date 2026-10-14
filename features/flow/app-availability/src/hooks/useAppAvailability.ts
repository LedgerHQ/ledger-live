import type { AppAvailabilityStatus } from "../types";
import { useOfacGeoBlockCheck } from "./useOfacGeoBlockCheck";

export function useAppAvailability(): AppAvailabilityStatus {
  return useOfacGeoBlockCheck();
}
