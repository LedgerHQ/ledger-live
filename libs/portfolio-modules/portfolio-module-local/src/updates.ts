import {
  readHistory,
  toJsonOperation,
  type AccountOperation,
} from "@ledgerhq/account-module-framework";
import {
  assetKeyOf,
  type PageView,
  type UpdateView,
  type UpdatesQuery,
} from "@ledgerhq/portfolio-module-framework";
import { accountsMatching, inOrder, mapPage, pageFrom } from "./query";
import { requirePortfolio } from "./stored";
import type { LocalPortfolioDeps, StoredAccount } from "./types";

const DEFAULT_SIZE = 100;

type Update = { account: StoredAccount; operation: AccountOperation };

const compareUpdates = (a: Update, b: Update) =>
  a.operation.date.getTime() - b.operation.date.getTime() ||
  a.account.id.localeCompare(b.account.id) ||
  a.operation.id.localeCompare(b.operation.id);

const matches =
  ({ asset, address }: UpdatesQuery) =>
  ({ operation }: Update) =>
    (asset === undefined || assetKeyOf(operation.asset) === asset) &&
    (address === undefined ||
      operation.senders.includes(address) ||
      operation.recipients.includes(address));

/** `operation` is an `OperationView`: the account module's `JsonOperation`. */
const toUpdateView = ({ account, operation }: Update): UpdateView => ({
  network: account.network,
  accountId: account.id,
  operation: toJsonOperation(operation),
  time: operation.date.toISOString(),
  txHash: operation.hash,
});

export async function getUpdates(
  { store }: LocalPortfolioDeps,
  portfolioId: string,
  query: UpdatesQuery = {},
): Promise<PageView<UpdateView>> {
  const portfolio = await requirePortfolio(store, portfolioId);
  const servedAccounts = accountsMatching(portfolio.accounts, query).filter(
    ({ descriptor }) => descriptor,
  );
  const perAccount = await Promise.all(
    servedAccounts.map(async account =>
      (await readHistory(store.history(account.id))).map(operation => ({ account, operation })),
    ),
  );
  const updates = perAccount.flat().filter(matches(query));
  // Only the operations of the page are converted: every page would otherwise convert them all.
  const page = pageFrom(
    inOrder(updates, compareUpdates, query.order ?? "DESC"),
    query,
    DEFAULT_SIZE,
  );
  return mapPage(page, toUpdateView);
}
