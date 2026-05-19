import type { CSSProperties } from "react";
import BigNumber from "bignumber.js";
import type { FiatCurrency } from "@ledgerhq/types-cryptoassets";
import { DEFAULT_FIAT_DISPLAY_MAGNITUDE } from "./formatting";

type Tone = "success" | "error" | "muted";

/**
 * `"muted"` covers both zero and dust (sub-display-precision) values so the
 * UI never flashes red/green for noise below the displayed precision.
 */
function pnlTone(n: BigNumber, fiat?: FiatCurrency): Tone {
  const magnitude = fiat ? fiat.units[0].magnitude : DEFAULT_FIAT_DISPLAY_MAGNITUDE;
  const snapped = n.decimalPlaces(magnitude, BigNumber.ROUND_HALF_UP);
  if (snapped.isZero()) return "muted";
  if (snapped.isPositive()) return "success";
  return "error";
}

/** Inline-style variant, for Lumen slots that don't accept className tones. */
export function pnlToneCss(n: BigNumber, fiat?: FiatCurrency): CSSProperties {
  switch (pnlTone(n, fiat)) {
    case "muted":
      return { color: "var(--color-text-muted)" };
    case "success":
      return { color: "var(--color-text-success)" };
    case "error":
      return { color: "var(--color-text-error)" };
  }
}
