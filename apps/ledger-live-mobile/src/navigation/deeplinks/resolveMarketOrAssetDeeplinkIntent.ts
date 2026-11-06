import type { AssetDetailMarketState } from "LLM/features/AssetDetail/types";
import type { MarketListCategory } from "~/reducers/types";
import { resolveAssetDeeplinkAction } from "./resolveAssetDeeplinkAction";
import { validateMarketAssetPath, validateMarketListCategory } from "./validation";

export type MarketOrAssetHostname = "market" | "asset";

/**
 * Fully-resolved routing decision for a `market`/`asset` deeplink, kept pure so the (untestable)
 * `DeeplinksProvider` glue only has to translate an intent into a navigation call:
 * - `asset-detail`: open Asset Detail (token deeplinks carry `marketState`).
 * - `market-banner`: land on the Market list (optionally pre-selecting a category).
 * - `portfolio`: land on the portfolio.
 */
export type MarketOrAssetDeeplinkIntent =
  | {
      type: "asset-detail";
      source: "deeplink_market" | "deeplink_asset";
      currencyId: string;
      marketState?: AssetDetailMarketState;
    }
  | { type: "market-banner"; category?: MarketListCategory }
  | { type: "portfolio" };

type ResolveParams = Readonly<{
  hostname: MarketOrAssetHostname;
  pathname: string;
  shouldDisplayAssetDiscoverability: boolean;
  categoryParam: string | null;
}>;

export function resolveMarketOrAssetDeeplinkIntent({
  hostname,
  pathname,
  shouldDisplayAssetDiscoverability,
  categoryParam,
}: ResolveParams): MarketOrAssetDeeplinkIntent {
  const validatedMarketAsset = validateMarketAssetPath(pathname);

  if (validatedMarketAsset) {
    const action = resolveAssetDeeplinkAction(validatedMarketAsset);

    return {
      type: "asset-detail",
      source: hostname === "market" ? "deeplink_market" : "deeplink_asset",
      currencyId: action.currencyId,
      marketState: action.marketState,
    };
  }

  const hasPath = pathname.trim().split("/").some(Boolean);

  if (hostname === "market") {
    if (hasPath) return { type: "market-banner" };

    const category = shouldDisplayAssetDiscoverability
      ? validateMarketListCategory(categoryParam)
      : undefined;
    return { type: "market-banner", category };
  }

  if (hasPath) {
    return { type: "market-banner" };
  }

  return { type: "portfolio" };
}
