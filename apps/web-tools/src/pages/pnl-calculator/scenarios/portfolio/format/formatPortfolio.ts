import type { CSSProperties } from "react";
import type BigNumber from "bignumber.js";
import type { FiatCurrency } from "@ledgerhq/types-cryptoassets";
import {
  formatCryptoAmount,
  formatFiat,
  formatPnlPct,
  toMajor,
  ZERO_ASSET_PNL,
  ZERO_PORTFOLIO_PNL,
} from "../../../shared/formatting";
import { pnlToneCss } from "../../../shared/toneCss";
import type { AssetRow, PortfolioBreakdown, SkippedAccount } from "../model/types";

export type FormattedReconciliation = {
  applied: boolean;
  direction: "inflow" | "outflow" | "none";
  formattedDelta: string;
};

export type FormattedAssetRow = {
  id: string;
  ticker: string;
  currencyId: string;
  label: string;
  isTokenAccount: boolean;
  formattedHoldings: string;
  formattedCostBasis: string;
  formattedRealised: string;
  formattedUnrealised: string;
  formattedTotal: string;
  formattedPctVsCost: string;
  totalTone: CSSProperties;
  reconciliation: FormattedReconciliation;
};

export type FormattedPortfolio = {
  formattedCostBasis: string;
  formattedRealised: string;
  formattedUnrealised: string;
  formattedTotal: string;
  formattedPctVsCost: string;
  totalTone: CSSProperties;
  realisedTone: CSSProperties;
  unrealisedTone: CSSProperties;
  rows: FormattedAssetRow[];
  decodeFailures: SkippedAccount[];
  unsupported: SkippedAccount[];
};

function reconciliationDirection(delta: BigNumber): FormattedReconciliation["direction"] {
  if (delta.isZero()) return "none";
  if (delta.isPositive()) return "inflow";
  return "outflow";
}

function formatRow(row: AssetRow, fiat: FiatCurrency): FormattedAssetRow {
  const major = toMajor(row.pnl, fiat, ZERO_ASSET_PNL);
  const { applied, delta } = row.pnl.reconciliation;
  const direction = reconciliationDirection(delta);

  return {
    id: row.id,
    ticker: row.ticker,
    currencyId: row.currencyId,
    label: row.label,
    isTokenAccount: row.isTokenAccount,
    formattedHoldings: formatCryptoAmount(row.currency, row.balance),
    formattedCostBasis: formatFiat(fiat, major.costBasis),
    formattedRealised: formatFiat(fiat, major.realisedPnL, true),
    formattedUnrealised: formatFiat(fiat, major.unrealisedPnL, true),
    formattedTotal: formatFiat(fiat, major.totalPnL, true),
    formattedPctVsCost: formatPnlPct(major.totalPnL, major.lifetimeCost, fiat),
    totalTone: pnlToneCss(major.totalPnL),
    reconciliation: {
      applied,
      direction,
      formattedDelta: formatCryptoAmount(row.currency, delta.absoluteValue()),
    },
  };
}

export function formatPortfolio(
  breakdown: PortfolioBreakdown,
  fiat: FiatCurrency,
  decodeFailures: SkippedAccount[],
): FormattedPortfolio {
  const totalsMajor = toMajor(breakdown.totals, fiat, ZERO_PORTFOLIO_PNL);
  return {
    formattedCostBasis: formatFiat(fiat, totalsMajor.costBasis),
    formattedRealised: formatFiat(fiat, totalsMajor.realisedPnL, true),
    formattedUnrealised: formatFiat(fiat, totalsMajor.unrealisedPnL, true),
    formattedTotal: formatFiat(fiat, totalsMajor.totalPnL, true),
    formattedPctVsCost: formatPnlPct(
      totalsMajor.totalPnL,
      totalsMajor.lifetimeCost,
      fiat,
      "invested",
    ),
    totalTone: pnlToneCss(totalsMajor.totalPnL),
    realisedTone: pnlToneCss(totalsMajor.realisedPnL),
    unrealisedTone: pnlToneCss(totalsMajor.unrealisedPnL),
    rows: breakdown.rows.map(r => formatRow(r, fiat)),
    decodeFailures,
    unsupported: breakdown.unsupported,
  };
}
