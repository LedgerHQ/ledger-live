// Handle lifecycle of cached data.

import { NamingServiceStatus } from "./types";

// Expiration date depend on the resource's status.
export function isOutdated(resource: NamingServiceStatus): boolean {
  const now = Date.now();

  switch (resource.status) {
    case "loaded": {
      return now - resource.updatedAt > 60 * 1000; // 1 minute
    }
    case "error": {
      return now - resource.updatedAt > 30 * 1000; // 30 seconds
    }
  }
  return false;
}
