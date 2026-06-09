export type StockSuggestion = {
  /** DADA meta-currency id — stable React key. */
  id: string;
  name: string;
  ticker: string;
  navigationId: string;
  /** Underlying ledger currency id (first network), for the crypto icon. */
  ledgerId?: string;
};

export type StocksSectionViewModelResult = {
  /** Stocks ranked by market cap, already capped to the requested limit. */
  data: StockSuggestion[];
  isLoading: boolean;
};

export type StocksSectionViewProps = StocksSectionViewModelResult & {
  /** Number of skeleton rows rendered while loading. */
  limit: number;
  /** Redirects to the asset detail page for the given market id. */
  navigateToAsset: (currencyId: string) => void;
  /** Lands on the market list pre-filtered to the stocks category. */
  onSeeAll: () => void;
};
