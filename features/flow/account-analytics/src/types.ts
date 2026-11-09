import type { AssetsData } from "@domain/api-aggregated-assets";
import type { CryptoOrTokenCurrency, Currency } from "@domain/entity-currency";
import type { FiatCurrencyTicker } from "@domain/entity-currency-fiat";
import type { CounterValuesCacheView } from "@domain/entity-market-countervalues";

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
  iconId: string;
  ticker: string;
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
    fiatCurrencyId: FiatCurrencyTicker;
    period: AnalyticsPeriod;
  }>;

export type AnalyticsBalanceData = Readonly<{
  amount: number;
  variation: Readonly<{ amount: number; ratio: number | null }>;
  history: readonly Readonly<{ timestamp: number; amount: number }>[];
}>;

export type AnalyticsScope = Pick<
  AnalyticsQueryContext,
  "assetId" | "accountId" | "fiatCurrencyId" | "positionIds"
>;

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
  fiatCurrencyId: FiatCurrencyTicker;
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

export type AnalyticsAmount = Readonly<{ isZero: () => boolean; toNumber: () => number }>;

export type AnalyticsTokenAccountSource<Operation = unknown> = Readonly<{
  type: "TokenAccount";
  id: string;
  parentId: string;
  token: CryptoOrTokenCurrency;
  balance: AnalyticsAmount;
  operations: readonly Operation[];
}>;

export type AnalyticsAccountSource<Operation = unknown> = Readonly<{
  type: "Account";
  id: string;
  currency: CryptoOrTokenCurrency;
  freshAddress: string;
  balance: AnalyticsAmount;
  operations: readonly Operation[];
  subAccounts?: readonly AnalyticsTokenAccountSource<Operation>[];
}>;

export type AnalyticsPositionSource = AnalyticsAccountSource | AnalyticsTokenAccountSource;

export type AnalyticsPositionOf<Account extends AnalyticsAccountSource> =
  | Account
  | NonNullable<Account["subAccounts"]>[number];

export type AnalyticsPortfolioRange = "day" | "week" | "month" | "year" | "all";

export type AnalyticsCountervalueInput = Readonly<{
  countervalues: CounterValuesCacheView;
  fiat: Currency;
}>;

export type AnalyticsPortfolioSnapshot = Readonly<{
  balanceHistory: readonly Readonly<{ date: Date; value: number }>[];
  availableAccounts: readonly Readonly<{ id: string }>[];
  readVariation: (
    currentBalance: number,
  ) => Readonly<{ value: number; percentage?: number | null }>;
}>;

export type ReadAnalyticsPortfolio<Position extends AnalyticsPositionSource> = (
  positions: readonly Position[],
  range: AnalyticsPortfolioRange,
) => AnalyticsPortfolioSnapshot;

export type AnalyticsAssetsQuery = Readonly<{
  data: AssetsData | undefined;
  isSuccess: boolean;
  isError: boolean;
}>;

export type AnalyticsVariationStatus = "loading" | "ready" | "unavailable";

export type AnalyticsBalanceSummary = Readonly<{
  current: AnalyticsReadResult<number>;
  data: AnalyticsBalanceData | undefined;
  isCurrentAvailable: boolean;
  isCatalogLoading: boolean;
  isChartLoading: boolean;
  variationStatus: AnalyticsVariationStatus;
  showHeaderStatus: boolean;
  showPlotStatus: boolean;
}>;

export type AnalyticsPnlPositions<Position> = Readonly<{
  positions: Position[] | undefined;
  status: "loading" | "error" | "ready" | "unavailable";
}>;
