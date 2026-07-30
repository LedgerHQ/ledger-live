/**
 * CLI boundary for live-common's currency formatting.
 *
 * `formatCurrencyUnit` joins the value and its code with a NON-BREAKING SPACE (U+00A0), and some
 * locales group thousands with a NARROW NO-BREAK SPACE (U+202F). Both are the right call for the
 * desktop/mobile GUIs, which is why the shared helper is left alone — but they are wrong for a CLI:
 * they are invisible in a terminal, yet `grep " ETH"`, `awk`, `cut` and anything consuming
 * `--output json` all fail to match on them.
 *
 * Every wallet-cli amount string must go through here rather than calling `formatCurrencyUnit`
 * directly.
 */

import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { formatCurrencyUnitOptions } from "@ledgerhq/live-common/currencies/index";
import type { BigNumber } from "bignumber.js";
import type { Unit } from "@domain/entity-currency-unit";

/** Unicode spaces live-common can emit inside a formatted amount: NBSP and narrow NBSP. */
const UNICODE_SPACES = /[\u00A0\u202F]/g;

/** Replace every non-ASCII space in a formatted amount with U+0020. */
export function toAsciiSpaces(formatted: string): string {
  return formatted.replace(UNICODE_SPACES, " ");
}

/** `formatCurrencyUnit` with terminal- and pipe-safe spacing. */
export function formatCliCurrencyUnit(
  unit: Unit,
  value: BigNumber,
  options?: formatCurrencyUnitOptions,
): string {
  return toAsciiSpaces(formatCurrencyUnit(unit, value, options));
}
