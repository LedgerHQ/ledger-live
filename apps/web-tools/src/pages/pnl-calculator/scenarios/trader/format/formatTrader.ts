import type { CSSProperties } from "react";
import type { FiatCurrency } from "@ledgerhq/types-cryptoassets";
import { formatCryptoAmount, formatFiat, formatPnlPct } from "../../../shared/formatting";
import { pnlToneCss } from "../../../shared/toneCss";
import { getAsset } from "../model/assets";
import { makeDefaultOpInput } from "../model/factories";
import type { TraderPortfolioResult } from "../model/computePortfolio";
import type { TraderResult } from "../model/computeAccount";
import type { AssetDescriptor, TraderAccountState, TraderOpInput } from "../model/types";

export type FormattedAccount = {
  id: string;
  assetId: AssetDescriptor["id"];
  asset: AssetDescriptor;
  ticker: string;
  currentPriceUsd: string;
  rows: TraderAccountState["rows"];
  /** Pre-built op-input the view passes to "Add operation" dialogs. */
  defaultOpInput: TraderOpInput;
  inCount: number;
  outCount: number;
  feesCount: number;
  opsCount: number;
  formattedFinalBalance: string;
  formattedCostBasis: string;
  formattedRealised: string;
  formattedUnrealised: string;
  formattedTotalPnL: string;
  /** `totalPnL` as % of `costBasis`. `—` when cost rounds to zero. */
  formattedPctVsCost: string;
  totalTone: CSSProperties;
  realisedTone: CSSProperties;
  unrealisedTone: CSSProperties;
};

export type FormattedPortfolio = {
  formattedTotalPnL: string;
  formattedCostBasis: string;
  formattedRealised: string;
  formattedUnrealised: string;
  formattedPctVsCost: string;
  totalTone: CSSProperties;
  realisedTone: CSSProperties;
  unrealisedTone: CSSProperties;
};

/** `result` must already be in major fiat units (see `toMajor`). */
export function formatAccount(
  state: TraderAccountState,
  result: TraderResult,
  fiat: FiatCurrency,
): FormattedAccount {
  const asset = getAsset(state.assetId);
  return {
    id: state.id,
    assetId: state.assetId,
    asset,
    ticker: asset.ticker,
    currentPriceUsd: state.currentPriceUsd,
    rows: state.rows,
    defaultOpInput: makeDefaultOpInput(asset, "IN"),
    inCount: result.inCount,
    outCount: result.outCount,
    feesCount: result.feesCount,
    opsCount: result.inCount + result.outCount + result.feesCount,
    formattedFinalBalance: formatCryptoAmount(asset.currency, result.finalBalanceAtomic),
    formattedCostBasis: formatFiat(fiat, result.costBasis),
    formattedRealised: formatFiat(fiat, result.realisedPnL, true),
    formattedUnrealised: formatFiat(fiat, result.unrealisedPnL, true),
    formattedTotalPnL: formatFiat(fiat, result.totalPnL, true),
    formattedPctVsCost: formatPnlPct(result.totalPnL, result.costBasis, fiat),
    totalTone: pnlToneCss(result.totalPnL),
    realisedTone: pnlToneCss(result.realisedPnL),
    unrealisedTone: pnlToneCss(result.unrealisedPnL),
  };
}

export function formatPortfolio(
  portfolio: TraderPortfolioResult,
  fiat: FiatCurrency,
): FormattedPortfolio {
  const t = portfolio.totals;
  return {
    formattedTotalPnL: formatFiat(fiat, t.totalPnL, true),
    formattedCostBasis: formatFiat(fiat, t.costBasis),
    formattedRealised: formatFiat(fiat, t.realisedPnL, true),
    formattedUnrealised: formatFiat(fiat, t.unrealisedPnL, true),
    formattedPctVsCost: formatPnlPct(t.totalPnL, t.costBasis, fiat, "cost"),
    totalTone: pnlToneCss(t.totalPnL),
    realisedTone: pnlToneCss(t.realisedPnL),
    unrealisedTone: pnlToneCss(t.unrealisedPnL),
  };
}
