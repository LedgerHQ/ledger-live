export type AppAvailabilityStatus =
  | { status: "pending" }
  | { status: "available" }
  | {
      status: "unavailable";
      reason: "geoBlocked" | "serviceUnavailable";
      retry?: () => void;
    };
