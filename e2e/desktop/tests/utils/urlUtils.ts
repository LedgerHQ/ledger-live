import { Page } from "@playwright/test";
import { isAggregatedAssetsEnabled } from "./featureFlagUtils";

export function doubleDecodeGoToURL(url: string): string {
  try {
    return decodeURIComponent(decodeURIComponent(url));
  } catch (err) {
    throw new Error(
      `Failed to double‐decode goToURL. Raw fragment: "${url}". Error: ${err instanceof Error ? err.message : err}`,
    );
  }
}

// Wallet 4.0 `aggregatedAssets` redirects the legacy market coin route (`/market/:id`) to the
// asset detail route (`/asset/:id`). Read the flag actually injected into the running page so the
// assertion targets the exact expected route instead of accepting either shape.
export const coinDetailUrlPattern = async (page: Page, assetId: string): Promise<RegExp> => {
  const escaped = assetId.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  const route = (await isAggregatedAssetsEnabled(page)) ? "asset" : "market";
  return new RegExp(`/${route}/${escaped}`);
};
