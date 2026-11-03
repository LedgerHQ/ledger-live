export type AnalyticsMetric = "balance" | "realised-return" | "unrealised-return" | "total-return";

export type AnalyticsPeriod = "1d" | "1w" | "1m" | "1y" | "all";

export type AnalyticsAsset = Readonly<{
  id: string;
  name: string;
  ticker: string;
  iconId: string;
}>;

export type AnalyticsAccount = Readonly<{
  id: string;
  name: string;
  networkName: string;
  address: string;
}>;

export type AnalyticsPosition = Readonly<{
  positionId: string;
  accountId: string;
  currencyId: string;
  assetId: string;
}>;

export type AnalyticsCatalog = Readonly<{
  assets: readonly AnalyticsAsset[];
  accounts: readonly AnalyticsAccount[];
  positions: readonly AnalyticsPosition[];
}>;

export type AnalyticsCatalogState =
  | Readonly<{ status: "ready"; data: AnalyticsCatalog }>
  | Readonly<{ status: "loading" | "error" }>;

export type AnalyticsSelection = Readonly<{
  assetId: string | null;
  accountId: string | null;
  metric: AnalyticsMetric;
}>;

export type AnalyticsInitialSelection = Readonly<{
  currencyId: string;
  accountId: string;
}>;

export type AnalyticsQueryContext = AnalyticsSelection &
  Readonly<{
    positionIds: readonly string[];
    fiatCurrencyId: string;
    period: AnalyticsPeriod;
  }>;

export type AnalyticsBalanceData = Readonly<{
  amount: number;
  variation: Readonly<{ amount: number; ratio: number | null }>;
  history: readonly Readonly<{ timestamp: number; amount: number }>[];
}>;

export type AnalyticsReadResult<Data> =
  | Readonly<{ status: "ready"; data: Data }>
  | Readonly<{ status: "unavailable" }>;

export type AnalyticsResultState<Data> =
  | AnalyticsReadResult<Data>
  | Readonly<{ status: "loading" | "error" }>;

export type AccountAnalyticsDataPort = Readonly<{
  loadBalance: (
    context: AnalyticsQueryContext,
    options: Readonly<{ signal: AbortSignal }>,
  ) => Promise<AnalyticsReadResult<AnalyticsBalanceData>>;
}>;

export type UseAccountAnalyticsViewModelProps = Readonly<{
  catalog: AnalyticsCatalogState;
  fiatCurrencyId: string;
  period: AnalyticsPeriod;
  initialSelection?: AnalyticsInitialSelection;
  dataPort: AccountAnalyticsDataPort;
}>;

export type AccountAnalyticsViewModel = Readonly<{
  selection: AnalyticsSelection;
  context: AnalyticsQueryContext;
  contextKey: string;
  balance: AnalyticsResultState<AnalyticsBalanceData>;
  assets: readonly AnalyticsAsset[];
  accounts: readonly AnalyticsAccount[];
  selectAsset: (assetId: string | null) => void;
  selectAccount: (accountId: string | null) => void;
  selectMetric: (metric: AnalyticsMetric) => void;
  retry: () => void;
}>;
