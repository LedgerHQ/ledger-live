import { AssetSuggestionSection } from "LLD/components/TopBar/components/TopBarSearch/SearchOverlay/types";

export type AssetSuggestionsViewModelResult = {
  /** Top cryptos (excluding stablecoins) ranked by market cap, capped to the limit. */
  cryptos: AssetSuggestionSection;
  /** Top stablecoins ranked by market cap, capped to the limit. */
  stablecoins: AssetSuggestionSection;
};

export type AssetSuggestionsSectionProps = AssetSuggestionSection & {
  /** Section header label. */
  title: string;
  /** Number of skeleton rows rendered while loading. */
  limit: number;
  /** Disambiguates test ids and skeleton keys ("cryptos" | "stablecoins"). */
  testIdPrefix: string;
  /** Redirects to the asset detail page for the given market id. */
  navigateToAsset: (currencyId: string) => void;
  /** Lands on the market list. */
  onSeeAll: () => void;
};

export type AssetSuggestionsSectionViewProps = AssetSuggestionsSectionProps & {
  locale: string;
  counterCurrency: string;
};
