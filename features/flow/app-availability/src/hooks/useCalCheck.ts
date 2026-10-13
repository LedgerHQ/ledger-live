import { useEffect, useState } from "react";
import type { AppAvailabilityStatus } from "../types";
import { checkCalHealth, type CalHealthResult } from "./calHealth.internals";

function mapCalHealth(result: CalHealthResult): AppAvailabilityStatus {
  if (result === "failed") {
    return { status: "unavailable", reason: "serviceUnavailable" };
  }
  return { status: "available" };
}

export function useCalCheck(
  calServiceUrl: string,
  ledgerClientVersion: string,
): AppAvailabilityStatus {
  const [status, setStatus] = useState<AppAvailabilityStatus>({ status: "pending" });

  useEffect(() => {
    let cancelled = false;

    void checkCalHealth({ calServiceUrl, ledgerClientVersion }).then(result => {
      if (!cancelled) {
        setStatus(mapCalHealth(result));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [calServiceUrl, ledgerClientVersion]);

  return status;
}
