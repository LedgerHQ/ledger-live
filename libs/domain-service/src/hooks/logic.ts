// Handle lifecycle of cached data.

import { DomainServiceResponseLoaded, DomainServiceStatus } from "./types";

// Expiration date depend on the resource's status.
export function isOutdated(resource: DomainServiceStatus): boolean {
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

export const isLoaded = (
  domain: DomainServiceStatus
): domain is DomainServiceResponseLoaded => domain.status === "loaded";
