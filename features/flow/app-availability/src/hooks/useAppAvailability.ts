import type { AppAvailabilityStatus } from "../types";
import { composeAvailability } from "./composeAvailability.internals";
import { useCalCheck } from "./useCalCheck";
import { useOfacGeoBlockCheck } from "./useOfacGeoBlockCheck";

export function useAppAvailability(): AppAvailabilityStatus {
  const ofac = useOfacGeoBlockCheck();
  const cal = useCalCheck();
  return composeAvailability(ofac, cal);
}
