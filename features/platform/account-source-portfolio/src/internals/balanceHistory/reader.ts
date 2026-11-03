import type { AccountDataBatchReader, AccountTarget } from "@domain/api-account-data";
import type { Portfolio } from "@domain/api-account-portfolio";
import {
  DEFAULT_BALANCE_HISTORY_RANGE,
  type AccountBalanceHistory,
  type BalanceHistoryRange,
} from "@domain/entity-account-balance-history";
import { fiatOf, type Fiat } from "../fiat";
import { describeError, whenReady, type PortfolioDeps } from "../portfolio";
import { failedRead, readinessOf } from "../readiness";
import { logActivity } from "../snapshot";
import { readHistory } from "./read";
import { verdictOf, type Verdict } from "./verdict";

async function readOne(
  { client, portfolioId }: PortfolioDeps,
  portfolio: Portfolio,
  { descriptor }: AccountTarget,
  range: BalanceHistoryRange,
  fiat: Fiat | undefined,
): Promise<{ verdict: Verdict; calls: number }> {
  const readiness = readinessOf(descriptor, portfolio);
  if (readiness.state !== "ready") {
    return { verdict: { status: "failed", detail: readiness.detail }, calls: 0 };
  }
  try {
    const read = await readHistory(client, portfolioId, readiness.serverAccountId, range, fiat);
    return { verdict: verdictOf(descriptor, range, read, fiat), calls: read.calls };
  } catch (error) {
    return { verdict: { status: "failed", detail: describeError(error) }, calls: 1 };
  }
}

async function readBalanceHistories(
  deps: PortfolioDeps,
  targets: readonly AccountTarget[],
  range: BalanceHistoryRange,
  fiat: Fiat | undefined,
): Promise<PromiseSettledResult<AccountBalanceHistory>[]> {
  try {
    const portfolio = await whenReady(
      deps,
      targets.map(target => target.descriptor),
    );
    const reads = await deps.store.track(() =>
      Promise.all(targets.map(target => readOne(deps, portfolio, target, range, fiat))),
    );
    const calls = reads.reduce((total, read) => total + read.calls, 0);
    const served = reads.filter(read => read.verdict.status === "served").length;
    logActivity(
      deps.store,
      true,
      `Balance history (${range}) of ${targets.length} accounts in ${calls} calls: ${served} served`,
    );
    return reads.map(({ verdict }) =>
      verdict.status === "served"
        ? { status: "fulfilled", value: verdict.history }
        : failedRead(verdict.detail),
    );
  } catch (error) {
    const detail = describeError(error);
    logActivity(deps.store, false, `Balance history read failed: ${detail}`);
    return targets.map(() => failedRead(detail));
  }
}

/** Waits until the batch's accounts are ready on the service, then reads each one's history over the range. */
export const balanceHistoryReader =
  (deps: PortfolioDeps): AccountDataBatchReader<"balanceHistory"> =>
  (targets, query) =>
    readBalanceHistories(
      deps,
      targets,
      query?.range ?? DEFAULT_BALANCE_HISTORY_RANGE,
      fiatOf(query),
    );
