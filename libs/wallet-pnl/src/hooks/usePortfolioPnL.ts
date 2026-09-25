import { useMemo } from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import type { Currency } from "@domain/entity-currency";
import { computePortfolioPnL } from "../portfolioPnL";
import type { ComputePnLOptions, PortfolioPnL } from "../types";

export function usePortfolioPnL(
  accounts: AccountLike[],
  countervalues: unknown,
  fiat: Currency,
  options?: ComputePnLOptions,
): PortfolioPnL {
  return useMemo(
    () => computePortfolioPnL(accounts, countervalues, fiat, options),
    [accounts, countervalues, fiat, options],
  );
}
