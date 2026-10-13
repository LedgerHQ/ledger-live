import type { AppAvailabilityStatus } from "../types";
import { composeAvailability } from "./composeAvailability.internals";
import { useCalCheck } from "./useCalCheck";
import { useOfacGeoBlockCheck } from "./useOfacGeoBlockCheck";

export function useAppAvailability(
  calServiceUrl: string,
  ledgerClientVersion: string,
): AppAvailabilityStatus {
  const ofac = useOfacGeoBlockCheck();
  const cal = useCalCheck(calServiceUrl, ledgerClientVersion);
  return composeAvailability(ofac, cal);
}
