import {
  AccountDataNotServedError,
  type AccountDataBatchReader,
  type AccountTarget,
} from "@domain/api-account-data";
import type { Portfolio } from "@domain/api-account-portfolio";
import type { AccountOperationsPage } from "@domain/entity-account-operation";
import { isEvmAccount } from "../../evm";
import { describeError, registerMissing, type PortfolioDeps } from "../portfolio";
import { unservedAccount } from "../serviceAccount";
import { logActivity } from "../snapshot";
import { limitOf, readUpdates } from "./read";
import { verdictOf, type Verdict } from "./verdict";

const notServed = (detail: string): PromiseRejectedResult => ({
  status: "rejected",
  reason: new AccountDataNotServedError(`Portfolio: ${detail}`),
});

async function readOne(
  { client, portfolioId }: PortfolioDeps,
  portfolio: Portfolio,
  { descriptor, cursor }: AccountTarget,
  limit: number,
): Promise<{ verdict: Verdict; called: boolean }> {
  if (!isEvmAccount(descriptor)) {
    return { verdict: { status: "failed", detail: "Not an EVM account" }, called: false };
  }
  const unserved = unservedAccount(descriptor, portfolio);
  if (unserved) return { verdict: unserved, called: false };
  try {
    const page = await readUpdates(client, portfolioId, descriptor, { limit, cursor });
    return { verdict: verdictOf(descriptor, page), called: true };
  } catch (error) {
    return { verdict: { status: "failed", detail: describeError(error) }, called: true };
  }
}

async function readOperations(
  deps: PortfolioDeps,
  targets: readonly AccountTarget[],
  limit: number,
): Promise<PromiseSettledResult<AccountOperationsPage>[]> {
  try {
    const portfolio = await registerMissing(
      deps,
      targets.map(target => target.descriptor),
    );
    const reads = await deps.store.track(() =>
      Promise.all(targets.map(target => readOne(deps, portfolio, target, limit))),
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
        : notServed(verdict.detail),
    );
  } catch (error) {
    const detail = describeError(error);
    logActivity(deps.store, false, `Operations read failed: ${detail}`);
    return targets.map(() => notServed(detail));
  }
}

/** Registers what the batch misses, then reads one page of updates per account it tracks. */
export const operationsReader =
  (deps: PortfolioDeps): AccountDataBatchReader<"operations"> =>
  (targets, query) =>
    readOperations(deps, targets, limitOf(query));
