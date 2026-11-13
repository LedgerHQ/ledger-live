import type { AccountDataBatchReader, AccountTarget } from "@domain/api-account-data";
import {
  DEFAULT_BALANCE_HISTORY_RANGE,
  type AccountBalanceHistory,
  type BalanceHistoryRange,
} from "@domain/entity-account-balance-history";
import { cancelledWhenAll } from "../cancellation";
import { fiatOf, type Fiat } from "../fiat";
import {
  PortfolioReadCancelledError,
  describeError,
  whenReady,
  type PortfolioDeps,
  type ReadyPortfolio,
} from "../portfolio";
import { failedRead, readinessOf } from "../readiness";
import { logActivity } from "../snapshot";
import { readHistory } from "./read";
import { verdictOf, type Verdict } from "./verdict";

async function readOne(
  { client }: PortfolioDeps,
  { id, portfolio }: ReadyPortfolio,
  { descriptor, signal }: AccountTarget,
  range: BalanceHistoryRange,
  fiat: Fiat | undefined,
): Promise<{ verdict: Verdict; calls: number }> {
  const readiness = readinessOf(descriptor, portfolio);
  if (readiness.state !== "ready") {
    return { verdict: { status: "failed", detail: readiness.detail }, calls: 0 };
  }
  try {
    const read = await readHistory(client, id, readiness.serverAccountId, range, fiat, signal);
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
  const { signal, release } = cancelledWhenAll(targets.map(target => target.signal));
  try {
    const ready = await whenReady(
      deps,
      targets.map(target => target.descriptor),
      signal,
    );
    const reads = await deps.store.track(() =>
      Promise.all(targets.map(target => readOne(deps, ready, target, range, fiat))),
    );
    if (signal?.aborted) throw new PortfolioReadCancelledError();
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
  } finally {
    release();
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
