import { AssetSuggestionSection } from "LLD/components/TopBar/components/TopBarSearch/SearchOverlay/types";
import type { AssetNavigationMarketState } from "LLD/features/Assets/types";

export type AssetSuggestionsViewModelResult = {
  /** Top cryptos (excluding stablecoins) ranked by market cap, capped to the limit. */
  cryptos: AssetSuggestionSection;
  isError: boolean;
};

export type AssetSuggestionsSectionProps = AssetSuggestionSection & {
  /** Section header label. */
  title: string;
  /** Number of skeleton rows rendered while loading. */
  limit: number;
  /** Disambiguates test ids and skeleton keys (e.g. "cryptos"). */
  testIdPrefix: string;
  /** Redirects to the asset detail page for the given market id. */
  navigateToAsset: (currencyId: string, marketState?: AssetNavigationMarketState) => void;
  /** Lands on the market list. */
  onSeeAll: () => void;
};

export type AssetSuggestionsSectionViewProps = AssetSuggestionsSectionProps & {
  locale: string;
  counterCurrency: string;
};
