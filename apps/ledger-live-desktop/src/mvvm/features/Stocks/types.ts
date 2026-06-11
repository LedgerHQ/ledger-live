import type { StockSuggestion } from "@ledgerhq/live-common/dada-client/utils/assetDiscovery";

export type { StockSuggestion };

export type StocksSectionViewModelResult = {
  /** Stocks ranked by market cap, already capped to the requested limit. */
  data: StockSuggestion[];
  isLoading: boolean;
};

/** Header affordance: chevron "show more" (search) or "Explore" link (portfolio). */
export type StocksHeaderVariant = "showMore" | "explore";

export type StocksSectionViewProps = StocksSectionViewModelResult & {
  /** Number of skeleton rows rendered while loading. */
  limit: number;
  /** Redirects to the asset detail page for the given market id. */
  navigateToAsset: (currencyId: string) => void;
  /** Lands on the market list pre-filtered to the stocks category. */
  onSeeAll: () => void;
  /** Header affordance to render. Defaults to "showMore". */
  headerVariant?: StocksHeaderVariant;
};
