import type { PartialFeatures } from "@shared/feature-flags";

export interface OverridesExport {
  content: string;
  filename: string;
}

/**
 * Turns the overrides map into a JSON payload and a dated filename.
 * Platform-specific delivery (download / share) is handled by the caller.
 */
export function buildOverridesExport(overrides: PartialFeatures): OverridesExport {
  const content = JSON.stringify(overrides, null, 2);
  const date = new Date().toISOString().split("T")[0];
  const filename = `feature-flags-overrides-${date}.json`;
  return { content, filename };
}
