import { useCheckOfacGeoBlockQuery } from "@domain/api-ofac";
import type { AppAvailabilityStatus } from "../types";

export function useOfacGeoBlockCheck(): AppAvailabilityStatus {
  const { data: geoBlocked, error, isError, isLoading } = useCheckOfacGeoBlockQuery();
  // RTK Query keeps `error` while a new subscriber fetches a failed check again.
  const checkFailed = isError || error !== undefined;

  // RTK Query keeps the last 451 when a refetch fails: a failed request never lifts a known block.
  if (geoBlocked === true) {
    return { status: "unavailable", reason: "geoBlocked" };
  }

  if (checkFailed) {
    return { status: "available" };
  }

  if (isLoading) {
    return { status: "pending" };
  }

  return { status: "available" };
}
