import {
  AccountDataNotServedError,
  type AccountDataBatchReader,
  type AccountTarget,
} from "@domain/api-account-data";
import type { AccountAssetBalance } from "@domain/entity-account-balance";
import { isEvmAccount, serverAccountId } from "../../evm";
import { describeError, registerMissing, type PortfolioDeps } from "../portfolio";
import { logActivity, recordOutcomes } from "../snapshot";
import { readBalanceGroups, type BalanceRead } from "./read";
import { verdictOf, type Verdict } from "./verdict";

const NOTHING_READ: BalanceRead = { groups: new Map(), truncated: false, calls: 0 };

const notServed = (detail: string): PromiseRejectedResult => ({
  status: "rejected",
  reason: new AccountDataNotServedError(`Portfolio: ${detail}`),
});

async function readBalances(
  deps: PortfolioDeps,
  targets: readonly AccountTarget[],
): Promise<PromiseSettledResult<AccountAssetBalance[]>[]> {
  const { client, portfolioId, store } = deps;
  try {
    const portfolio = await registerMissing(
      deps,
      targets.map(target => target.descriptor),
    );
    const known = new Set((portfolio.accounts ?? []).map(account => account.id));
    const ids = targets.flatMap(({ descriptor }) =>
      isEvmAccount(descriptor) && known.has(serverAccountId(descriptor))
        ? [serverAccountId(descriptor)]
        : [],
    );
    const read =
      ids.length === 0
        ? NOTHING_READ
        : await store.track(() => readBalanceGroups(client, portfolioId, [...new Set(ids)]));
    const verdicts = targets.map(({ descriptor }): Verdict =>
      isEvmAccount(descriptor)
        ? verdictOf(descriptor, portfolio, read)
        : { status: "failed", detail: "Not an EVM account" },
    );
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
        : notServed(verdict.detail),
    );
  } catch (error) {
    // A failed service call fails no account: each one goes to the next ranked source.
    const detail = describeError(error);
    const at = Date.now();
    recordOutcomes(
      store,
      targets.map(({ accountUUID }) => [accountUUID, { status: "failed", detail, rows: 0, at }]),
    );
    logActivity(store, false, `Balance read failed: ${detail}`);
    return targets.map(() => notServed(detail));
  }
}

/** Registers what the batch misses, reads its balances, then serves each account or lets it fall through. */
export const balanceReader =
  (deps: PortfolioDeps): AccountDataBatchReader<"balance"> =>
  targets =>
    readBalances(deps, targets);
