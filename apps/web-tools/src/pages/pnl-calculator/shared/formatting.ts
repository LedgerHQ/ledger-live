import BigNumber from "bignumber.js";
import type { Currency, FiatCurrency } from "@ledgerhq/types-cryptoassets";
import { pnlPercentage, type AssetPnL, type PortfolioPnL } from "@ledgerhq/wallet-pnl";

export const ZERO = new BigNumber(0);

// Default display precision used when we don't know the fiat (matches USD/EUR cents).
const DEFAULT_FIAT_DISPLAY_MAGNITUDE = 2;

export function fiatMinorScale(fiat: FiatCurrency): BigNumber {
  return new BigNumber(10).pow(fiat.units[0].magnitude);
}

export function parseBn(s: string): BigNumber {
  if (!s) return ZERO;
  const n = new BigNumber(s);
  return n.isFinite() ? n : ZERO;
}

/** Falls back to `min` when `s` cannot be parsed. */
export function clampInt(s: string, min: number, max: number): number {
  const n = Math.floor(Number.parseFloat(s));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

// Rounds to the same precision the UI prints, so sub-display-unit dust is
// treated as exactly zero (no spurious +/- sign or success/error color).
function snapToDisplay(bn: BigNumber, magnitude: number): BigNumber {
  return bn.decimalPlaces(magnitude, BigNumber.ROUND_HALF_UP);
}

export function formatFiat(fiat: FiatCurrency, bn: BigNumber, withSign = false): string {
  const magnitude = fiat.units[0].magnitude;
  const snapped = snapToDisplay(bn, magnitude);
  // `narrowSymbol` keeps "$" / "€" / "£" but strips the locale prefix
  // ("US$" → "$", "CA$" → "$") regardless of the user's runtime locale.
  const formatted = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: fiat.ticker,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: magnitude,
    maximumFractionDigits: magnitude,
  }).format(snapped.abs().toNumber());
  if (snapped.isZero()) return formatted;
  if (snapped.isNegative()) return `-${formatted}`;
  if (withSign) return `+${formatted}`;
  return formatted;
}

export function formatCryptoAmount(currency: Currency, atomic: BigNumber): string {
  const unit = currency.units[0];
  const major = atomic.div(new BigNumber(10).pow(unit.magnitude));
  const decimals = Math.min(8, unit.magnitude);
  return `${major.toFixed(decimals)} ${unit.code}`;
}

export function formatPctVsBasis(pct: BigNumber, basisLabel: string): string {
  return `${pct.toFixed(2)}% vs ${basisLabel}`;
}

/**
 * Falls back to `—` when `basis` rounds to zero at the displayed fiat
 * precision. Guards against `dust / dust → 10⁹ %` artifacts on spam-airdrop
 * positions. Both `pnl` and `basis` must be in major fiat units.
 */
export function formatPnlPct(
  pnl: BigNumber,
  basis: BigNumber,
  fiat: FiatCurrency,
  basisLabel?: string,
): string {
  const snapped = basis.decimalPlaces(fiat.units[0].magnitude, BigNumber.ROUND_HALF_UP);
  if (snapped.isZero()) return "—";
  const pct = pnlPercentage(pnl, basis);
  if (pct === null) return "—";
  return basisLabel ? formatPctVsBasis(pct, basisLabel) : `${pct.toFixed(2)}%`;
}

export { DEFAULT_FIAT_DISPLAY_MAGNITUDE };

/** Used as the `zero` default by `toMajor` when `computeAssetPnL` returned `null`. */
export const ZERO_ASSET_PNL: AssetPnL = {
  unrealisedPnL: ZERO,
  realisedPnL: ZERO,
  totalPnL: ZERO,
  costBasis: ZERO,
  lifetimeCost: ZERO,
  averageEntryPrice: ZERO,
  reconciliation: {
    recordedAmount: ZERO,
    onChainBalance: ZERO,
    delta: ZERO,
    isClean: true,
    applied: false,
  },
};

export const ZERO_PORTFOLIO_PNL: PortfolioPnL = {
  unrealisedPnL: ZERO,
  realisedPnL: ZERO,
  totalPnL: ZERO,
  costBasis: ZERO,
  lifetimeCost: ZERO,
};

export function toMajor<T extends AssetPnL | PortfolioPnL>(
  pnl: T | null | undefined,
  fiat: FiatCurrency,
  zero: T,
): T {
  const source = pnl ?? zero;
  const scale = fiatMinorScale(fiat);
  const out = {} as Record<string, unknown>;
  for (const key of Object.keys(source) as Array<keyof T>) {
    const value = source[key];
    out[key as string] = BigNumber.isBigNumber(value) ? value.div(scale) : value;
  }
  return out as T;
}
