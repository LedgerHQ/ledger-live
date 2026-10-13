import type { AppAvailabilityStatus } from "../types";
import { useCheckCalHealthQuery } from "./calHealthApi.internals";
import type { CalHealthResult } from "./calHealth.internals";

function mapCalHealth(result: CalHealthResult): AppAvailabilityStatus {
  if (result === "failed") {
    return { status: "unavailable", reason: "serviceUnavailable" };
  }
  return { status: "available" };
}

export function useCalCheck(): AppAvailabilityStatus {
  const query = useCheckCalHealthQuery();

  if (query.data === undefined) {
    return { status: "pending" };
  }

  return mapCalHealth(query.data);
}
