import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BigNumber from "bignumber.js";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import type { FormattedValue } from "@ledgerhq/lumen-ui-rnative";
import type { Account, AccountLike, DistributionItem, Operation } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getOperationAmountNumber } from "@ledgerhq/live-common/operation";
import { flattenAccounts } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useAssetChartData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import {
  formatPrice,
  formatPriceFragment,
  formatSignedFiatVariation,
} from "@ledgerhq/live-currency-format";
import { useSelector } from "~/context/hooks";
import { accountsSelector, flattenAccountsSelector } from "~/reducers/accounts";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
import { useCountervaluesState } from "~/reducers/countervalues";
import { useOperationsV1 } from "~/screens/Analytics/Operations/useOperationsV1";
import { track } from "~/analytics";
import { useTranslation, useLocale } from "~/context/Locale";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import {
  getExtremaPointMarkers,
  resolveLineChartColorFromPercentChange,
  type LineChartPointMarker,
  type LineChartScrubberPositionChange,
  type LineChartSeries,
  type LineChartTooltipTitle,
  type LineChartValueFormatter,
  type LineChartXAxisConfig,
  type LineChartYAxisConfig,
} from "LLM/components/LineChart";
import {
  BALANCE_GRAPH_RANGES,
  RANGE_TO_PRICE_CHANGE_KEY,
  computeChartRangeChangePercentage,
  isChartDerivedPriceChangeRange,
  isRangeKey,
  type RangeKey,
} from "../../utils/rangeMapping";
import { useAssetMarketData } from "../../hooks/useAssetMarketData";
import {
  groupTransactionsByChartIndex,
  type TransactionInput,
} from "./utils/getTransactionPointMarkers";
import { buildTransactionPointMarker } from "./utils/buildTransactionPointMarker";
import { downsampleChartPoints } from "./utils/downsampleChartPoints";

// Upper bound on operations pulled for the chart's transaction dots. The chart only
// marks operations inside the visible window, so this just caps the lookback; raise it
// if assets with very dense histories should surface older dots on long ranges.
const TRANSACTION_DOTS_MAX_OPERATIONS = 1000;

const MIN_X_AXIS_TICKS = 5;
const MIN_X_AXIS_TICKS_1D = 8;

/**
 * Asymmetric padding added to the y-axis domain (as a ratio of the value range).
 * Most of it sits at the bottom to lift the lowest point off the x-axis so its
 * "below" label clears the x-axis tick labels, while the top stays nearly tight
 * so the line keeps its amplitude and does not look flat.
 */
const Y_AXIS_PADDING_BOTTOM_RATIO = 0.12;
const Y_AXIS_PADDING_TOP_RATIO = 0.04;

/**
 * Returns evenly spaced data indices (always including the first and last point)
 * so the x-axis renders at least `minTicks` labels when enough data is available.
 */
function getEvenlySpacedTicks(length: number, minTicks: number): number[] {
  if (length <= 0) return [];
  if (length <= minTicks) return Array.from({ length }, (_, index) => index);

  const ticks = Array.from({ length: minTicks }, (_, index) =>
    Math.round((index * (length - 1)) / (minTicks - 1)),
  );
  return Array.from(new Set(ticks));
}

/**
 * Hovered chart point while scrubbing. Holds raw values only (formatting stays
 * in the view model); shaped as an object so more fields (e.g. variation) can be
 * added later without touching the scrub plumbing.
 */
type ScrubSelection = Readonly<{ price: number; timestamp: number }>;

type Params = {
  currency?: AssetDetailCurrencyProps;
  marketApiId?: string;
  knownLedgerIds?: readonly string[];
  knownMarketId?: string;
  hideReceive?: boolean;
  ledgerIds?: string[];
  distributionItem?: DistributionItem;
};

export function useBalanceGraphViewModel({
  currency,
  marketApiId,
  knownLedgerIds,
  knownMarketId,
  hideReceive,
  ledgerIds,
  distributionItem,
}: Params) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const counterValueUnit = counterValueCurrency.units[0];
  const {
    marketCurrency,
    counterCurrency,
    isLoading,
    ledgerIds: derivedLedgerIds,
  } = useAssetMarketData({
    marketApiId,
    knownLedgerIds,
    knownMarketId,
  });
  // Prefer ledgerIds explicitly threaded down by the parent (which has the
  // distribution item's `marketId` and resolves tokens correctly). Fall back
  // to the locally derived list when used standalone (e.g. unit tests).
  const effectiveLedgerIds = ledgerIds ?? derivedLedgerIds;

  const [range, setRange] = useState<RangeKey>("1d");
  const [selection, setSelection] = useState<ScrubSelection | undefined>(undefined);

  const id =
    knownLedgerIds?.[0] ?? marketCurrency?.ledgerIds?.[0] ?? marketCurrency?.id ?? marketApiId;

  const { data: chartData, isLoading: isChartLoading } = useAssetChartData(
    { id, counterCurrency, range },
    { skip: !id },
  );

  const ranges = useMemo(
    () =>
      BALANCE_GRAPH_RANGES.map(r => ({
        label: t(`assetDetail.balanceGraph.range.${r}`),
        value: r,
      })),
    [t],
  );

  const onRangeChange = useCallback(
    (value: RangeKey) => {
      if (value === range) return;
      setSelection(undefined);
      setRange(value);
      track("button_clicked", {
        button: "timeframe",
        timeframe: value,
        page: "Asset Detail",
        currency: currency?.id,
      });
    },
    [range, currency?.id],
  );

  const price = marketCurrency?.price;

  const priceFormatter = useCallback(
    (value: number): FormattedValue => formatPriceFragment(counterValueUnit, value, locale),
    [counterValueUnit, locale],
  );

  const { series, timestamps } = useMemo(() => {
    const points = chartData?.[range] ?? [];
    const rawValues: number[] = [];
    const rawTimestamps: number[] = [];
    points.forEach(([timestamp, value]) => {
      rawValues.push(value);
      rawTimestamps.push(timestamp);
    });
    // Cap the points fed to the SVG path: the market API returns ~350 points on
    // some ranges, which is far more than the chart width can show and is the main
    // source of render jank on mobile. Timestamps + values are reduced together so
    // scrubber indices, x-axis ticks and markers stay aligned with the line.
    const { timestamps: tsList, values: data } = downsampleChartPoints(rawTimestamps, rawValues);
    return {
      series: [
        {
          id: "asset-detail-price",
          data,
          label: "Price",
          // `stroke` is required by the Series type but is overridden by the
          // shared LineChart from the `color` prop.
          stroke: "",
        },
      ] satisfies LineChartSeries[],
      timestamps: tsList,
    };
  }, [chartData, range]);
  const prices = series[0].data;

  const priceChangePercentage = useMemo(() => {
    // No market-API key exists for 6m/all, so the change is derived purely from the
    // rendered series. When the series is too short to derive it, surface undefined
    // (→ neutral dash) rather than mislabel another period's change under this range.
    if (isChartDerivedPriceChangeRange(range)) {
      return computeChartRangeChangePercentage(prices);
    }
    const key = RANGE_TO_PRICE_CHANGE_KEY[range];
    return key != null ? marketCurrency?.priceChangePercentage[key] : undefined;
  }, [range, prices, marketCurrency?.priceChangePercentage]);

  const formattedPriceChange = useMemo(() => {
    if (priceChangePercentage == null) return undefined;
    // For chart-derived ranges (6m/all) the percentage comes from the rendered series,
    // so derive the fiat change from the same series endpoints — multiplying the live
    // price by a series-based percentage would yield an amount inconsistent with both
    // the percentage and the line. Other ranges keep using the live market price.
    if (isChartDerivedPriceChangeRange(range)) {
      const first = prices[0];
      const last = prices[prices.length - 1];
      if (!Number.isFinite(first) || !Number.isFinite(last)) return undefined;
      return formatSignedFiatVariation(last - first, counterValueUnit, locale);
    }
    if (price == null) return undefined;
    const delta = price * (priceChangePercentage / 100);
    return formatSignedFiatVariation(delta, counterValueUnit, locale);
  }, [priceChangePercentage, range, prices, price, locale, counterValueUnit]);

  const rangeTimeLabel = t(`assetDetail.balanceGraph.timeLabel.${range}`);

  // Flatten so token sub-accounts (e.g. ERC-20 stablecoins held inside an
  // Ethereum parent account) are inspected too. Using parent accounts alone
  // would miss token balances and incorrectly surface the Receive CTA on a
  // funded token asset.
  const flatAccounts = useSelector(flattenAccountsSelector);

  const showReceive = useMemo(() => {
    if (hideReceive || !currency) return false;
    const hasAssetFunds = flatAccounts.some(
      a => getAccountCurrency(a).id === currency.id && a.balance.gt(0),
    );
    const hasFundsElsewhere = flatAccounts.some(
      a => getAccountCurrency(a).id !== currency.id && a.balance.gt(0),
    );
    return !hasAssetFunds && hasFundsElsewhere;
  }, [hideReceive, flatAccounts, currency]);

  const { handleOpenReceiveDrawer } = useOpenReceiveDrawer({
    currency,
    currencyIds: effectiveLedgerIds,
    sourceScreenName: "Asset Detail",
  });

  const onReceivePress = useCallback(() => {
    track("button_clicked", {
      button: "receive",
      page: "Asset Detail",
      currency: currency?.id,
    });
    handleOpenReceiveDrawer();
  }, [handleOpenReceiveDrawer, currency?.id]);

  const onScrubberPositionChange = useCallback<LineChartScrubberPositionChange>(
    index => {
      if (index == null) return setSelection(undefined);
      const scrubPrice = prices[index];
      const timestamp = timestamps[index];
      setSelection(
        Number.isFinite(scrubPrice) && timestamp != null
          ? { price: scrubPrice, timestamp }
          : undefined,
      );
    },
    [prices, timestamps],
  );

  useEffect(() => {
    setSelection(undefined);
  }, [id]);

  const isScrubbing = selection != null;
  const displayedPrice = selection?.price ?? price ?? 0;

  const chartColor = resolveLineChartColorFromPercentChange(priceChangePercentage);

  const formatValue = useCallback<LineChartValueFormatter>(
    value =>
      formatPrice(counterValueUnit, new BigNumber(value).times(10 ** counterValueUnit.magnitude), {
        showCode: true,
        locale,
      }),
    [counterValueUnit, locale],
  );

  // Mirror desktop's `hourFormat` / `dayFormat`: intraday shows the time, longer
  // ranges show the full numeric day/month/year (e.g. "5/29/2026").
  const dateFormatters = useMemo(
    () => ({
      hour: new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "numeric" }),
      day: new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      }),
    }),
    [locale],
  );
  const formatDate = useCallback(
    (date: Date) => (range === "1d" ? dateFormatters.hour : dateFormatters.day).format(date),
    [range, dateFormatters],
  );

  const scrubbedDateLabel =
    selection != null ? formatDate(new Date(selection.timestamp)) : undefined;

  // While scrubbing, the trend reflects the change from the start of the selected
  // range up to the scrubbed point (the line color stays tied to the range below).
  const scrubVariation = useMemo(() => {
    if (selection == null) return undefined;
    const baselinePrice = prices[0];
    if (!Number.isFinite(baselinePrice)) return undefined;
    const variationFiat = selection.price - baselinePrice;
    const percentage = baselinePrice !== 0 ? (variationFiat / baselinePrice) * 100 : 0;
    return { percentage, variationFiat };
  }, [selection, prices]);

  // Unknown range variation surfaces as NaN so the trend renders a neutral dash,
  // distinct from a genuine 0% (flat or scrubbed back to the range start).
  const displayedPriceChangePercentage = scrubVariation
    ? scrubVariation.percentage
    : priceChangePercentage ?? NaN;

  const displayedFormattedPriceChange = useMemo(() => {
    if (scrubVariation == null) return formattedPriceChange;
    return formatSignedFiatVariation(scrubVariation.variationFiat, counterValueUnit, locale);
  }, [scrubVariation, formattedPriceChange, counterValueUnit, locale]);

  const timeLabel = isScrubbing ? scrubbedDateLabel : rangeTimeLabel;

  const tooltipTitle = useCallback<LineChartTooltipTitle>(
    dataIndex => {
      const timestamp = timestamps[dataIndex];
      if (timestamp == null) return undefined;
      return formatDate(new Date(timestamp));
    },
    [timestamps, formatDate],
  );

  const xAxis = useMemo<LineChartXAxisConfig>(
    () => ({
      showLine: false,
      ticks: getEvenlySpacedTicks(
        timestamps.length,
        range === "1d" ? MIN_X_AXIS_TICKS_1D : MIN_X_AXIS_TICKS,
      ),
      tickLabelFormatter: value => {
        const timestamp = timestamps[Number(value)];
        return timestamp == null ? "" : formatDate(new Date(timestamp));
      },
    }),
    [timestamps, formatDate, range],
  );

  const yAxis = useMemo<LineChartYAxisConfig>(
    () => ({
      domain: ({ min, max }) => {
        const valueRange = max - min || Math.abs(max) || 1;
        return {
          min: min - valueRange * Y_AXIS_PADDING_BOTTOM_RATIO,
          max: max + valueRange * Y_AXIS_PADDING_TOP_RATIO,
        };
      },
    }),
    [],
  );

  // Scope operations to the asset's accounts so the chart only marks the
  // transactions it represents, mirroring the Transactions section's scoping.
  const allAccounts = useSelector(accountsSelector);
  const discreet = useSelector(discreetModeSelector);
  // Read through a ref so countervalue polling (which swaps the state reference on
  // every tick) does not invalidate the `transactions` memo and force the memoized
  // chart to re-render. Historical fiat is treated as stable; if rates land after the
  // operation set settles, the dots refresh on the next change to that set.
  const countervaluesState = useCountervaluesState();
  const countervaluesStateRef = useRef(countervaluesState);
  countervaluesStateRef.current = countervaluesState;

  const allowedIds = useMemo(() => {
    if (distributionItem) {
      return new Set(distributionItem.accounts.map(a => a.id));
    }
    if (currency?.type === "CryptoCurrency") {
      return new Set(allAccounts.filter(a => a.currency.id === currency.id).map(a => a.id));
    }
    return new Set<string>();
  }, [distributionItem, currency, allAccounts]);

  const rootAccounts: Account[] = useMemo(() => {
    if (allowedIds.size === 0) return [];
    return allAccounts.filter(root => flattenAccounts([root]).some(a => allowedIds.has(a.id)));
  }, [allAccounts, allowedIds]);

  const scopedFilter = useCallback(
    (_op: Operation, account: AccountLike) => allowedIds.has(account.id),
    [allowedIds],
  );

  const { sections } = useOperationsV1(rootAccounts, TRANSACTION_DOTS_MAX_OPERATIONS, {
    filterOperation: scopedFilter,
  });

  // `useOperationsV1` rebuilds `sections` on every render, so flattening it is the
  // only per-render work we keep here. The downstream fiat conversion and marker
  // build are gated behind a stable operation signature below.
  const flatOperations = useMemo<Operation[]>(
    () => sections.flatMap(section => section.data),
    [sections],
  );

  // Identity-stable operation list: the reference only changes when the actual set
  // of operations changes (not on countervalue polls or unrelated re-renders), which
  // keeps `transactions`/`points` — and therefore the memoized chart — stable. The
  // signature stays cheap (count + boundary ids) instead of joining every id on each
  // render: the list is date-ordered, so its length and endpoints identify the set.
  const operationsSignature = `${flatOperations.length}:${flatOperations[0]?.id ?? ""}:${
    flatOperations[flatOperations.length - 1]?.id ?? ""
  }`;
  const operationsRef = useRef(flatOperations);
  const operationsSignatureRef = useRef(operationsSignature);
  if (operationsSignatureRef.current !== operationsSignature) {
    operationsSignatureRef.current = operationsSignature;
    operationsRef.current = flatOperations;
  }
  const operations = operationsRef.current;

  const currencyByAccountId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getAccountCurrency>>();
    for (const account of flattenAccounts(rootAccounts)) {
      map.set(account.id, getAccountCurrency(account));
    }
    return map;
  }, [rootAccounts]);

  const transactions = useMemo<TransactionInput[]>(() => {
    const windowStartMs = timestamps[0];
    const windowEndMs = timestamps[timestamps.length - 1];
    if (windowStartMs == null || windowEndMs == null) return [];
    return operations.flatMap(op => {
      const dateMs = op.date.getTime();
      // Only operations inside the rendered window can become a marker; skip the rest
      // before the (relatively costly) per-op countervalue conversion below.
      if (dateMs < windowStartMs || dateMs > windowEndMs) return [];
      const opCurrency = currencyByAccountId.get(op.accountId);
      if (!opCurrency) return [];
      const amount = getOperationAmountNumber(op);
      const fiat = calculate(countervaluesStateRef.current, {
        from: opCurrency,
        to: counterValueCurrency,
        value: amount.abs().toNumber(),
        date: op.date,
        disableRounding: true,
      });
      return [
        {
          dateMs,
          direction: amount.isNegative() ? ("out" as const) : ("in" as const),
          fiat: fiat ?? null,
        },
      ];
    });
  }, [operations, currencyByAccountId, counterValueCurrency, timestamps]);

  const formatFiat = useCallback(
    (value: number) =>
      formatCurrencyUnit(counterValueUnit, new BigNumber(value), {
        showCode: true,
        locale,
        discreet,
      }),
    [counterValueUnit, locale, discreet],
  );

  const points = useMemo<LineChartPointMarker[]>(() => {
    const extrema = getExtremaPointMarkers(series);
    if (transactions.length === 0 || timestamps.length < 2) return extrema;
    const groups = groupTransactionsByChartIndex({ timestamps, values: prices, transactions });
    return [...extrema, ...groups.map(group => buildTransactionPointMarker(group, t, formatFiat))];
  }, [series, transactions, timestamps, prices, t, formatFiat]);

  return {
    price: displayedPrice,
    priceFormatter,
    hasMarketData: price != null,
    priceChangePercentage: displayedPriceChangePercentage,
    formattedPriceChange: displayedFormattedPriceChange,
    timeLabel,
    ranges,
    selectedRange: range,
    onRangeChange,
    isRangeValue: isRangeKey,
    showReceive,
    onReceivePress,
    isLoading: isLoading || isChartLoading,
    series,
    chartColor,
    points,
    pointTooltipsOnly: true,
    formatValue,
    tooltipTitle,
    onScrubberPositionChange,
    isScrubbing,
    showXAxis: false,
    showYAxis: false,
    xAxis,
    yAxis,
  };
}
