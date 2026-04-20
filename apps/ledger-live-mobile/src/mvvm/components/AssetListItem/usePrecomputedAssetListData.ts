import { useMemo, useRef } from "react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import { getCurrencyPortfolio } from "@ledgerhq/live-countervalues/portfolio";
import { useThrottledValue } from "@ledgerhq/live-hooks/useThrottledFunction";
import { ValueChange } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { useLocale } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  selectedTimeRangeSelector,
} from "~/reducers/settings";
import { Asset } from "~/types/asset";

export interface AssetListItemViewModelResult {
  formattedBalance: string;
  formattedCounterValue: string | null;
  countervalueChange: ValueChange | null;
}

// ---------------------------------------------------------------------------
// Internal shared state – subscribed once at the list level
// ---------------------------------------------------------------------------

const CV_THROTTLE_MS = 5_000;

interface SharedState {
  cvState: ReturnType<typeof useCountervaluesState>;
  counterValueCurrency: ReturnType<typeof counterValueCurrencySelector>;
  range: ReturnType<typeof selectedTimeRangeSelector>;
  locale: string;
  discreet: boolean;
}

// ---------------------------------------------------------------------------
// Per-item computation – pure functions, no hooks
// ---------------------------------------------------------------------------

type FmtOpts = { locale: string; showCode: boolean; discreet: boolean };

function formatCounterValue(
  asset: Asset,
  balance: BigNumber,
  cvState: SharedState["cvState"],
  counterValueCurrency: SharedState["counterValueCurrency"],
  fmtOpts: FmtOpts,
): string | null {
  const cvUnit = counterValueCurrency.units?.[0];
  if (!cvUnit) return null;

  if (asset.isPlaceholder) {
    return formatCurrencyUnit(cvUnit, new BigNumber(0), fmtOpts);
  }

  const cv = calculate(cvState, {
    from: asset.currency,
    to: counterValueCurrency,
    value: balance.toNumber(),
    disableRounding: true,
  });

  if (typeof cv !== "number") return null;
  return formatCurrencyUnit(cvUnit, new BigNumber(cv), fmtOpts);
}

function getCountervalueChange(asset: Asset, state: SharedState): ValueChange | null {
  if (asset.isPlaceholder || asset.accounts.length === 0) return null;

  const { countervalueChange } = getCurrencyPortfolio(
    asset.accounts,
    state.range,
    state.cvState,
    state.counterValueCurrency,
  );
  return countervalueChange;
}

function computeAssetItemData(asset: Asset, state: SharedState): AssetListItemViewModelResult {
  const balance = BigNumber(asset.amount);
  const fmtOpts: FmtOpts = { locale: state.locale, showCode: true, discreet: state.discreet };

  const unit = asset.currency.units?.[0];
  const formattedBalance = unit ? formatCurrencyUnit(unit, balance, fmtOpts) : "";
  const formattedCounterValue = formatCounterValue(
    asset,
    balance,
    state.cvState,
    state.counterValueCurrency,
    fmtOpts,
  );
  const countervalueChange = getCountervalueChange(asset, state);

  return { formattedBalance, formattedCounterValue, countervalueChange };
}

// ---------------------------------------------------------------------------
// Stable-ref helpers
// ---------------------------------------------------------------------------

function shallowEqual(a: AssetListItemViewModelResult, b: AssetListItemViewModelResult): boolean {
  return (
    a.formattedBalance === b.formattedBalance &&
    a.formattedCounterValue === b.formattedCounterValue &&
    a.countervalueChange?.percentage === b.countervalueChange?.percentage &&
    a.countervalueChange?.value === b.countervalueChange?.value
  );
}

// ---------------------------------------------------------------------------
// Batch hook – computes all items in one pass with throttled CV state
// and per-currency stable refs so React.memo works on consumers.
// ---------------------------------------------------------------------------

export function usePrecomputedAssetListData(
  assets: Asset[],
): Map<string, AssetListItemViewModelResult> {
  const { locale } = useLocale();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const discreet = useSelector(discreetModeSelector);
  const range = useSelector(selectedTimeRangeSelector);

  const rawCvState = useCountervaluesState();
  const cvState = useThrottledValue(rawCvState, CV_THROTTLE_MS);

  const cacheRef = useRef(new Map<string, AssetListItemViewModelResult>());

  return useMemo(() => {
    const state: SharedState = { cvState, counterValueCurrency, range, locale, discreet };
    const prev = cacheRef.current;
    const next = new Map<string, AssetListItemViewModelResult>();
    let changed = prev.size !== assets.length;

    for (const asset of assets) {
      const key = asset.currency.id;
      const fresh = computeAssetItemData(asset, state);
      const cached = prev.get(key);
      if (cached && shallowEqual(cached, fresh)) {
        next.set(key, cached);
      } else {
        next.set(key, fresh);
        changed = true;
      }
    }

    if (!changed) return prev;
    cacheRef.current = next;
    return next;
  }, [assets, cvState, counterValueCurrency, range, locale, discreet]);
}
