import { useMemo } from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { computePortfolioPnL } from "../portfolioPnL";
import type { ComputePnLOptions, PortfolioPnL } from "../types";

export function usePortfolioPnL(
  accounts: AccountLike[],
  countervalues: CounterValuesState,
  fiat: Currency,
  options?: ComputePnLOptions,
): PortfolioPnL {
  return useMemo(
    () => computePortfolioPnL(accounts, countervalues, fiat, options),
    [accounts, countervalues, fiat, options],
  );
}
