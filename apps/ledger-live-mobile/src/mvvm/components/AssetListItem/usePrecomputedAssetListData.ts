import { useEffect, useMemo, useRef, useState } from "react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { formatPrice } from "@ledgerhq/live-currency-format";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import {
  getCurrencyPortfolio,
  getCurrentBalanceCountervalueChange,
} from "@ledgerhq/live-common/portfolio/portfolio";
import { ValueChange } from "@ledgerhq/types-live";

function useThrottledFunction<FnReturnType, Args extends unknown[]>(
  callbackFunction: (...args: Args) => FnReturnType,
  throttleMs: number,
  args: Args,
): FnReturnType {
  const [state, setState] = useState<FnReturnType>(() => callbackFunction(...args));
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutMs = useRef<number>(throttleMs);
  const skipInitialValue = useRef(true);
  const nextArgs = useRef<Args | null>(null);

  useEffect(() => {
    const throttleDelayChanged = timeoutMs.current !== throttleMs;
    timeoutMs.current = throttleMs;
    const timeoutCallback = () => {
      if (nextArgs.current) {
        setState(callbackFunction(...nextArgs.current));
        nextArgs.current = null;
        timeout.current = setTimeout(timeoutCallback, timeoutMs.current);
      } else {
        timeout.current = null;
      }
    };
    if (!timeout.current) {
      if (skipInitialValue.current) {
        skipInitialValue.current = false;
      } else {
        setState(callbackFunction(...args));
      }
      timeout.current = setTimeout(timeoutCallback, timeoutMs.current);
    } else {
      if (throttleDelayChanged) {
        clearTimeout(timeout.current);
        timeout.current = setTimeout(timeoutCallback, timeoutMs.current);
      }
      nextArgs.current = args;
    }
  }, [...args, throttleMs]); // eslint-disable-line

  useEffect(
    () => () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    },
    [],
  );

  return state;
}

function useThrottledValue<ValueType>(value: ValueType, throttleMs: number): ValueType {
  return useThrottledFunction(v => v, throttleMs, [value]);
}
import BigNumber from "bignumber.js";
import { useLocale } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
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
  range: "day";
  locale: string;
  discreet: boolean;
}

// ---------------------------------------------------------------------------
// Per-item computation – pure functions, no hooks
// ---------------------------------------------------------------------------

type FmtOpts = { locale: string; showCode: boolean; discreet: boolean };

function getCounterValue(
  asset: Asset,
  balance: BigNumber,
  cvState: SharedState["cvState"],
  counterValueCurrency: SharedState["counterValueCurrency"],
): number | null {
  if (asset.isPlaceholder) {
    return 0;
  }

  if (asset.countervalue !== undefined) {
    return asset.countervalue;
  }

  const cv = calculate(cvState, {
    from: asset.currency,
    to: counterValueCurrency,
    value: balance.toNumber(),
    disableRounding: true,
  });

  if (typeof cv !== "number") return null;
  return cv;
}

function formatCounterValue(
  counterValue: number | null,
  counterValueCurrency: SharedState["counterValueCurrency"],
  fmtOpts: FmtOpts,
): string | null {
  const cvUnit = counterValueCurrency.units?.[0];
  if (!cvUnit || counterValue == null) return null;
  return formatPrice(cvUnit, new BigNumber(counterValue), fmtOpts);
}

function getCountervalueChange(
  asset: Asset,
  state: SharedState,
  currentCounterValue: number | null,
): ValueChange | null {
  if (asset.isPlaceholder || asset.accounts.length === 0) return null;
  if (asset.amount <= 0 || (currentCounterValue != null && currentCounterValue <= 0)) {
    return { value: 0, percentage: 0 };
  }

  const { countervalueChange } = getCurrencyPortfolio(
    asset.accounts,
    state.range,
    state.cvState,
    state.counterValueCurrency,
  );

  // Fallback: when the 24h portfolio change is unavailable (e.g. freshly-held positions
  // whose 24h-ago balance was zero), show the asset's 1D price change computed from countervalues.
  if (countervalueChange.percentage == null) {
    return getCurrentBalanceCountervalueChange(
      asset.accounts,
      state.range,
      state.cvState,
      state.counterValueCurrency,
    );
  }

  return countervalueChange;
}

function computeAssetItemData(asset: Asset, state: SharedState): AssetListItemViewModelResult {
  const balance = BigNumber(asset.amount);
  const fmtOpts: FmtOpts = { locale: state.locale, showCode: true, discreet: state.discreet };

  const unit = asset.currency.units?.[0];
  const formattedBalance = unit ? formatCurrencyUnit(unit, balance, fmtOpts) : "";
  const counterValue = getCounterValue(asset, balance, state.cvState, state.counterValueCurrency);
  const formattedCounterValue = formatCounterValue(
    counterValue,
    state.counterValueCurrency,
    fmtOpts,
  );
  const countervalueChange = getCountervalueChange(asset, state, counterValue);

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
  const range = "day" as const;

  const rawCvState = useCountervaluesState();
  const cvState = useThrottledValue(rawCvState, CV_THROTTLE_MS);

  const cacheRef = useRef(new Map<string, AssetListItemViewModelResult>());

  return useMemo(() => {
    const state: SharedState = {
      cvState,
      counterValueCurrency,
      range,
      locale,
      discreet,
    };
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
