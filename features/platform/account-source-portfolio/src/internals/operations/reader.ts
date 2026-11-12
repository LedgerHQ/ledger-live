import type { AccountDataBatchReader, AccountTarget } from "@domain/api-account-data";
import type {
  AccountOperationsPage,
  AccountOperationsQuery,
} from "@domain/entity-account-operation";
import { cancelledWhenAll } from "../cancellation";
import {
  PortfolioReadCancelledError,
  describeError,
  whenReady,
  type PortfolioDeps,
  type ReadyPortfolio,
} from "../portfolio";
import { failedRead, readinessOf } from "../readiness";
import { logActivity } from "../snapshot";
import { limitOf, readUpdates } from "./read";
import { verdictOf, type Verdict } from "./verdict";

async function readOne(
  { client }: PortfolioDeps,
  { id, portfolio }: ReadyPortfolio,
  { descriptor, cursor, signal }: AccountTarget,
  query: AccountOperationsQuery | undefined,
): Promise<{ verdict: Verdict; called: boolean }> {
  const readiness = readinessOf(descriptor, portfolio);
  if (readiness.state !== "ready") {
    return { verdict: { status: "failed", detail: readiness.detail }, called: false };
  }
  try {
    const page = await readUpdates(
      client,
      id,
      readiness.serverAccountId,
      { limit: limitOf(query), cursor },
      signal,
    );
    return {
      verdict: verdictOf(descriptor, page, { filterAsset: query?.filterAsset }),
      called: true,
    };
  } catch (error) {
    return { verdict: { status: "failed", detail: describeError(error) }, called: true };
  }
}

async function readOperations(
  deps: PortfolioDeps,
  targets: readonly AccountTarget[],
  query: AccountOperationsQuery | undefined,
): Promise<PromiseSettledResult<AccountOperationsPage>[]> {
  const { signal, release } = cancelledWhenAll(targets.map(target => target.signal));
  try {
    const ready = await whenReady(
      deps,
      targets.map(target => target.descriptor),
      signal,
    );
    const reads = await deps.store.track(() =>
      Promise.all(targets.map(target => readOne(deps, ready, target, query))),
    );
    if (signal?.aborted) throw new PortfolioReadCancelledError();
    const calls = reads.filter(read => read.called).length;
    const served = reads.filter(read => read.verdict.status === "served").length;
    logActivity(
      deps.store,
      true,
      `Operations of ${targets.length} accounts in ${calls} calls: ${served} served`,
    );
    return reads.map(({ verdict }) =>
      verdict.status === "served"
        ? { status: "fulfilled", value: verdict.page }
        : failedRead(verdict.detail),
    );
  } catch (error) {
    const detail = describeError(error);
    logActivity(deps.store, false, `Operations read failed: ${detail}`);
    return targets.map(() => failedRead(detail));
  } finally {
    release();
  }
}

/** Waits until the batch's accounts are ready on the service, then reads one page of updates per account. */
export const operationsReader =
  (deps: PortfolioDeps): AccountDataBatchReader<"operations"> =>
  (targets, query) =>
    readOperations(deps, targets, query);
