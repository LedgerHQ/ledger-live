import type { StockSuggestion } from "@ledgerhq/live-common/dada-client/utils/assetDiscovery";
import type { AssetNavigationMarketState } from "LLD/features/Assets/types";

export type { StockSuggestion };

export type StocksSection = {
  /** Stocks ranked by market cap, already capped to the requested limit. */
  data: StockSuggestion[];
  isLoading: boolean;
};

export type StocksSectionViewModelResult = StocksSection & {
  isError: boolean;
};

/** Header affordance: chevron "show more" (search) or "Explore" link (portfolio). */
export type StocksHeaderVariant = "showMore" | "explore";

export type StocksSectionViewProps = StocksSection & {
  /** Number of skeleton rows rendered while loading. */
  limit: number;
  /** Redirects to the asset detail page for the given market id. */
  navigateToAsset: (currencyId: string, marketState?: AssetNavigationMarketState) => void;
  /** Lands on the market list pre-filtered to the stocks category. */
  onSeeAll: () => void;
  /** Header affordance to render. Defaults to "showMore". */
  headerVariant?: StocksHeaderVariant;
  /** Extra class on the horizontal-scroll wrapper (e.g. negative margin to full-bleed in a padded popover). */
  listClassName?: string;
  /** Extra class on the inner scroll container (e.g. padding to keep items aligned when full-bleeding). */
  scrollContainerClassName?: string;
  /** Hide the scroll edge gradient (keeps the hover chevron). */
  hideListGradient?: boolean;
};
