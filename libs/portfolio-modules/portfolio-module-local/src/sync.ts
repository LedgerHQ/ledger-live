import { drain } from "@ledgerhq/account-module-framework";
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
    await drain(network.accountModule.sync(network.context, data, signal ? { signal } : {}));
    await update(({ error, failure, ...stored }) => ({ ...stored, status: "synchronized" }));
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
 * Syncs every account served locally through its account module, one after the other: the module
 * puts the account state into the stored account (`stateStoreOf`). An account that fails keeps the
 * last state its module put and records the error (its message and its JSON form); the others go
 * on. A successful sync clears both.
 */
export async function syncPortfolio(
  deps: LocalPortfolioDeps,
  portfolioId: string,
  options: SyncOptions = {},
): Promise<PortfolioAccount[]> {
  const portfolio = await requirePortfolio(deps.store, portfolioId);
  for (const account of portfolio.accounts) {
    options.signal?.throwIfAborted();
    const local = localAccountOf(deps, portfolioId, account);
    if (local) await syncAccount(deps, portfolioId, account.id, local, options);
  }
  const synced = await requirePortfolio(deps.store, portfolioId);
  return synced.accounts.map(toPortfolioAccount);
}
