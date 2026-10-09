import { useCheckQuery } from "@domain/api-ofac";
import type { AppAvailabilityStatus } from "../types";

export function useOfacGeoBlockCheck(): AppAvailabilityStatus {
  const { data: geoBlocked, isError, isLoading } = useCheckQuery();

  if (isLoading) {
    return { status: "pending" };
  }

  if (isError) {
    return { status: "available" };
  }

  if (geoBlocked === true) {
    return { status: "unavailable", reason: "geoBlocked" };
  }

  return { status: "available" };
}
