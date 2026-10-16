import type { AccountData } from "@ledgerhq/account-module-framework";
import {
  PortfolioApiError,
  type Portfolio,
  type PortfolioAccount,
} from "@ledgerhq/portfolio-module-framework";
import { localNetworkOf } from "./localNetworks";
import type {
  AccountRef,
  LocalNetwork,
  LocalPortfolioDeps,
  PortfolioStore,
  StoredAccount,
  StoredPortfolio,
} from "./types";

export async function requirePortfolio(
  store: PortfolioStore,
  portfolioId: string,
): Promise<StoredPortfolio> {
  const portfolio = await store.get(portfolioId);
  if (!portfolio) throw new PortfolioApiError("NOT_FOUND", `Portfolio ${portfolioId} not found`);
  return portfolio;
}

/** Applies `update` to the latest stored version of the account, not to a stale copy. */
export async function updateAccount(
  store: PortfolioStore,
  portfolioId: string,
  accountId: string,
  update: (account: StoredAccount) => StoredAccount,
): Promise<StoredPortfolio> {
  const portfolio = await requirePortfolio(store, portfolioId);
  const updated = {
    ...portfolio,
    accounts: portfolio.accounts.map(account =>
      account.id === accountId ? update(account) : account,
    ),
  };
  await store.put(updated);
  return updated;
}

/** `error` is why the registration or the last sync failed: its JSON form, else its message. */
export const toPortfolioAccount = ({
  id,
  network,
  status,
  error,
  failure,
}: StoredAccount): PortfolioAccount => {
  const view = failure ?? (error ? { name: "Error", message: error } : undefined);
  return { id, network, status, ...(view ? { error: view } : {}) };
};

export const toPortfolio = ({ id, registrations, accounts }: StoredPortfolio): Portfolio => ({
  id,
  registrations,
  accounts: accounts.map(toPortfolioAccount),
});

/** What the account module knows of the account; nothing for an account not served locally. */
export const accountDataOf = (
  store: PortfolioStore,
  { id, descriptor, state }: StoredAccount,
): AccountData | undefined => descriptor && { descriptor, state, history: store.history(id) };

export async function loadAccountData(
  store: PortfolioStore,
  { portfolioId, accountId }: AccountRef,
): Promise<AccountData | undefined> {
  const portfolio = await store.get(portfolioId);
  const account = portfolio?.accounts.find(({ id }) => id === accountId);
  return account && accountDataOf(store, account);
}

export type LocalAccount = { network: LocalNetwork; data: AccountData };

/** The network and account module data of an account served locally. */
export function localAccountOf(
  { networks, store }: Pick<LocalPortfolioDeps, "networks" | "store">,
  account: StoredAccount,
): LocalAccount | undefined {
  const network = localNetworkOf(networks, account.network);
  const data = accountDataOf(store, account);
  return network && data && { network, data };
}
