import { useCheckOfacGeoBlockQuery } from "@domain/api-ofac";
import type { AppAvailabilityStatus } from "../types";

export function useOfacGeoBlockCheck(): AppAvailabilityStatus {
  const { data: geoBlocked, error, isError, isLoading } = useCheckOfacGeoBlockQuery();
  // RTK Query keeps `error` while a new subscriber fetches a failed check again.
  const checkFailed = isError || error !== undefined;

  if (checkFailed) {
    return { status: "available" };
  }

  if (isLoading) {
    return { status: "pending" };
  }

  if (geoBlocked === true) {
    return { status: "unavailable", reason: "geoBlocked" };
  }

  return { status: "available" };
}
