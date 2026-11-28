import type { AccountDataSource } from "@domain/api-account-data";
import type { CountervaluesHost } from "./types";
import { withBalanceHistoryCountervalues } from "./withBalanceHistoryCountervalues";
import { withOperationCountervalues } from "./withOperationCountervalues";

/** The source, its operations and balance histories valued in the fiat a query asks for. */
export const withCountervalues = (
  source: AccountDataSource,
  host: CountervaluesHost,
): AccountDataSource =>
  withBalanceHistoryCountervalues(withOperationCountervalues(source, host), host);
