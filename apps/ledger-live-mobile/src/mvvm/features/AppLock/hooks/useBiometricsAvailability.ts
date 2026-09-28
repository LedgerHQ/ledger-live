import {
  getBiometricsAvailability,
  type BiometricsAvailability,
} from "@features/platform-app-lock";
import { useEffect, useState } from "react";

export function useBiometricsAvailability(): BiometricsAvailability | undefined {
  const [availability, setAvailability] = useState<BiometricsAvailability | undefined>(undefined);

  useEffect(() => {
    let isStale = false;

    getBiometricsAvailability()
      // A rejection would otherwise leave this undefined for good, hiding the row with no trace.
      .catch(() => ({ status: "unavailable" }) as const)
      .then(next => {
        if (!isStale) {
          setAvailability(next);
        }
      });

    return () => {
      isStale = true;
    };
  }, []);

  return availability;
}
