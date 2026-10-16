import type { PortfolioAccount } from "@ledgerhq/portfolio-module-framework";
import { toErrorView } from "./errors";
import {
  localAccountOf,
  requirePortfolio,
  toPortfolioAccount,
  updateAccount,
  type LocalAccount,
} from "./stored";
import type { LocalPortfolioDeps, StoredAccount } from "./types";

type SyncOptions = { signal?: AbortSignal };

async function syncAccount(
  { store }: LocalPortfolioDeps,
  portfolioId: string,
  accountId: string,
  { network, data }: LocalAccount,
  { signal }: SyncOptions,
): Promise<void> {
  const update = (patch: (account: StoredAccount) => StoredAccount) =>
    updateAccount(store, portfolioId, accountId, patch);
  try {
    let { state } = data;
    const events = network.accountModule.sync(network.context, data, signal ? { signal } : {});
    for await (const event of events) state = event.state;
    await update(({ error, failure, ...stored }) => ({
      ...stored,
      ...(state ? { state } : {}),
      status: "synchronized",
    }));
  } catch (error) {
    if (signal?.aborted) throw error;
    await update(stored => ({
      ...stored,
      status: stored.status === "synchronized" ? "synchronized" : "registration_failure",
      error: error instanceof Error ? error.message : String(error),
      failure: toErrorView(error),
    }));
  }
}

/**
 * Syncs every account served locally through its account module, one after the other, and
 * persists its state. An account that fails keeps its last state and records the error (its message
 * and its JSON form); the others go on. A successful sync clears both.
 */
export async function syncPortfolio(
  deps: LocalPortfolioDeps,
  portfolioId: string,
  options: SyncOptions = {},
): Promise<PortfolioAccount[]> {
  const portfolio = await requirePortfolio(deps.store, portfolioId);
  for (const account of portfolio.accounts) {
    options.signal?.throwIfAborted();
    const local = localAccountOf(deps, account);
    if (local) await syncAccount(deps, portfolioId, account.id, local, options);
  }
  const synced = await requirePortfolio(deps.store, portfolioId);
  return synced.accounts.map(toPortfolioAccount);
}
