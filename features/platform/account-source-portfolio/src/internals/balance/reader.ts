import type { AccountDataBatchReader, AccountTarget } from "@domain/api-account-data";
import type { AccountAssetBalance } from "@domain/entity-account-balance";
import { describeError, whenReady, type PortfolioDeps } from "../portfolio";
import { failedRead, readinessOf } from "../readiness";
import { logActivity, recordOutcomes } from "../snapshot";
import { readBalanceGroups, type BalanceRead } from "./read";
import { verdictOf, type Verdict } from "./verdict";

const NOTHING_READ: BalanceRead = { groups: new Map(), truncated: false, calls: 0 };

async function readBalances(
  deps: PortfolioDeps,
  targets: readonly AccountTarget[],
): Promise<PromiseSettledResult<AccountAssetBalance[]>[]> {
  const { client, portfolioId, store } = deps;
  try {
    const portfolio = await whenReady(
      deps,
      targets.map(target => target.descriptor),
    );
    const readiness = targets.map(({ descriptor }) => readinessOf(descriptor, portfolio));
    const ids = readiness.flatMap(state =>
      state.state === "ready" ? [state.serverAccountId] : [],
    );
    const read =
      ids.length === 0
        ? NOTHING_READ
        : await store.track(() => readBalanceGroups(client, portfolioId, [...new Set(ids)]));
    const verdicts = targets.map(({ descriptor }, index): Verdict => {
      const state = readiness[index];
      return state.state === "ready"
        ? verdictOf(descriptor, state.serverAccountId, read)
        : { status: "failed", detail: state.detail };
    });
    const at = Date.now();
    recordOutcomes(
      store,
      targets.map(({ accountUUID }, index) => {
        const verdict = verdicts[index];
        const rows = verdict.status === "served" ? verdict.rows.length : 0;
        return [accountUUID, { status: verdict.status, detail: verdict.detail, rows, at }];
      }),
    );
    const served = verdicts.filter(verdict => verdict.status === "served").length;
    logActivity(
      store,
      true,
      `Balance of ${targets.length} accounts in ${read.calls} calls: ${served} served`,
    );
    return verdicts.map(verdict =>
      verdict.status === "served"
        ? { status: "fulfilled", value: verdict.rows }
        : failedRead(verdict.detail),
    );
  } catch (error) {
    const detail = describeError(error);
    const at = Date.now();
    recordOutcomes(
      store,
      targets.map(({ accountUUID }) => [accountUUID, { status: "failed", detail, rows: 0, at }]),
    );
    logActivity(store, false, `Balance read failed: ${detail}`);
    return targets.map(() => failedRead(detail));
  }
}

/** Waits until the batch's accounts are ready on the service, then reads their balances. */
export const balanceReader =
  (deps: PortfolioDeps): AccountDataBatchReader<"balance"> =>
  targets =>
    readBalances(deps, targets);
