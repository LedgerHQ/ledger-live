import { NFTResource } from "./types";

// Handle lifecycle of cached data.
// Expiration date depend on the resource's status.
export function isOutdated(resource: NFTResource): boolean {
  const now = Date.now();

  switch (resource.status) {
    case "loaded": {
      return now - resource.updatedAt > 14 * 24 * 60 * 60 * 1 * 1000; // 14 days
    }
    case "error": {
      return now - resource.updatedAt > 1 * 1000; // 1 second
    }
    case "nodata": {
      return now - resource.updatedAt > 24 * 60 * 60 * 1 * 1000; // 1 day
    }
  }
  return false;
}
