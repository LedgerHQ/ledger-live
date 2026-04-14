import { createContext, useContext, useMemo } from "react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import { getCurrencyPortfolio } from "@ledgerhq/live-countervalues/portfolio";
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
  deltaText: string;
  deltaColor: "success" | "error" | "muted";
}

// ---------------------------------------------------------------------------
// Shared state – subscribed once at the list level, consumed by each item
// ---------------------------------------------------------------------------

export interface AssetListSharedState {
  cvState: ReturnType<typeof useCountervaluesState>;
  counterValueCurrency: ReturnType<typeof counterValueCurrencySelector>;
  range: ReturnType<typeof selectedTimeRangeSelector>;
  locale: string;
  discreet: boolean;
}

export const AssetListSharedStateContext = createContext<AssetListSharedState | null>(null);

export function useAssetListSharedStateContext(): AssetListSharedState {
  const ctx = useContext(AssetListSharedStateContext);
  if (!ctx) {
    throw new Error(
      "useAssetListSharedStateContext must be used within <AssetListSharedStateContext.Provider>",
    );
  }
  return ctx;
}

export function useAssetListSharedState(): AssetListSharedState {
  const { locale } = useLocale();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const discreet = useSelector(discreetModeSelector);
  const range = useSelector(selectedTimeRangeSelector);
  const cvState = useCountervaluesState();

  return useMemo(
    () => ({ cvState, counterValueCurrency, range, locale, discreet }),
    [cvState, counterValueCurrency, range, locale, discreet],
  );
}

// ---------------------------------------------------------------------------
// Per-item computation – pure functions, no hooks
// ---------------------------------------------------------------------------

type FmtOpts = { locale: string; showCode: boolean; discreet: boolean };

function formatCounterValue(
  asset: Asset,
  balance: BigNumber,
  cvState: AssetListSharedState["cvState"],
  counterValueCurrency: AssetListSharedState["counterValueCurrency"],
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

function computeDelta(
  asset: Asset,
  state: AssetListSharedState,
): Pick<AssetListItemViewModelResult, "deltaText" | "deltaColor"> {
  if (asset.isPlaceholder || asset.accounts.length === 0) {
    return { deltaText: "–", deltaColor: "muted" };
  }

  const { countervalueChange } = getCurrencyPortfolio(
    asset.accounts,
    state.range,
    state.cvState,
    state.counterValueCurrency,
  );
  const percentage = countervalueChange.percentage;

  if (percentage == null) return { deltaText: "–", deltaColor: "muted" };

  const sign = percentage > 0 ? "+" : "";
  const deltaText = `${sign}${(percentage * 100).toFixed(2)}%`;
  let deltaColor: AssetListItemViewModelResult["deltaColor"] = "muted";
  if (percentage > 0) deltaColor = "success";
  else if (percentage < 0) deltaColor = "error";

  return { deltaText, deltaColor };
}

export function computeAssetItemData(
  asset: Asset,
  state: AssetListSharedState,
): AssetListItemViewModelResult {
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

  return { formattedBalance, formattedCounterValue, ...computeDelta(asset, state) };
}

// ---------------------------------------------------------------------------
// Batch hook – computes all items in one pass (for small, capped lists)
// ---------------------------------------------------------------------------

export function usePrecomputedAssetListData(
  assets: Asset[],
): Map<string, AssetListItemViewModelResult> {
  const sharedState = useAssetListSharedState();

  return useMemo(() => {
    const map = new Map<string, AssetListItemViewModelResult>();
    for (const asset of assets) {
      map.set(asset.currency.id, computeAssetItemData(asset, sharedState));
    }
    return map;
  }, [assets, sharedState]);
}
