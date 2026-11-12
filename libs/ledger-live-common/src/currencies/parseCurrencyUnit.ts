import BigNumber from "bignumber.js";
import { parseCurrencyUnit as parseCurrencyUnitUnsafe } from "@ledgerhq/live-currency-format";
import { parseFiniteBigNumber } from "@ledgerhq/ledger-wallet-framework/bignumber";

// Upstream calls `new BigNumber` before its NaN check, which throws on garbage with bignumber.js STRICT mode
export const parseCurrencyUnit: typeof parseCurrencyUnitUnsafe = (unit, valueString) =>
  parseFiniteBigNumber(valueString.replace(/,/g, "."))
    ? parseCurrencyUnitUnsafe(unit, valueString)
    : new BigNumber(0);
