import type { AccountDataBatchReader, AccountTarget } from "@domain/api-account-data";
import type { Portfolio } from "@domain/api-account-portfolio";
import type {
  AccountOperationsPage,
  AccountOperationsQuery,
} from "@domain/entity-account-operation";
import { describeError, whenReady, type PortfolioDeps } from "../portfolio";
import { failedRead, readinessOf } from "../readiness";
import { logActivity } from "../snapshot";
import { fiatOf, limitOf, readUpdates, serviceAssetOf } from "./read";
import { verdictOf, type Verdict } from "./verdict";

async function readOne(
  { client, portfolioId }: PortfolioDeps,
  portfolio: Portfolio,
  { descriptor, cursor }: AccountTarget,
  query: AccountOperationsQuery | undefined,
): Promise<{ verdict: Verdict; called: boolean }> {
  const readiness = readinessOf(descriptor, portfolio);
  if (readiness.state !== "ready") {
    return { verdict: { status: "failed", detail: readiness.detail }, called: false };
  }
  try {
    const filterAsset = query?.filterAsset;
    const filter = await serviceAssetOf(client, descriptor, filterAsset);
    if (!filter) {
      return { verdict: { status: "served", page: { operations: [] } }, called: false };
    }
    const fiat = fiatOf(query);
    const limit = limitOf(query);
    const page = await readUpdates(client, portfolioId, readiness.serverAccountId, {
      limit,
      cursor,
      asset: filter.asset,
      fiat,
    });
    return { verdict: verdictOf(descriptor, page, { fiat, filterAsset }), called: true };
  } catch (error) {
    return { verdict: { status: "failed", detail: describeError(error) }, called: true };
  }
}

async function readOperations(
  deps: PortfolioDeps,
  targets: readonly AccountTarget[],
  query: AccountOperationsQuery | undefined,
): Promise<PromiseSettledResult<AccountOperationsPage>[]> {
  try {
    const portfolio = await whenReady(
      deps,
      targets.map(target => target.descriptor),
    );
    const reads = await deps.store.track(() =>
      Promise.all(targets.map(target => readOne(deps, portfolio, target, query))),
    );
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
  }
}

/**
 * Waits until the batch's accounts are ready on the service, then reads one page of updates per
 * account, filtered and valued by the service as the query asks.
 */
export const operationsReader =
  (deps: PortfolioDeps): AccountDataBatchReader<"operations"> =>
  (targets, query) =>
    readOperations(deps, targets, query);
