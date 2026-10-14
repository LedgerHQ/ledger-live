import type { Balance } from "@ledgerhq/coin-module-framework/api/types";
import type {
  AccountBalances,
  BalanceEntry,
  BalanceQuery,
  PageView,
} from "@ledgerhq/portfolio-module-framework";
import { assetKeyOf, assetMetadataOf, type AssetMetadata } from "./assets";
import { accountsMatching, inOrder, pageFrom } from "./query";
import { localAccountOf, requirePortfolio } from "./stored";
import type { LocalPortfolioDeps, StoredAccount } from "./types";

const DEFAULT_SIZE = 20;

function entriesOf(
  account: StoredAccount,
  { asset, value, locked = 0n }: Balance,
  nativeAsset: AssetMetadata,
): BalanceEntry[] {
  const entry = {
    network: account.network,
    account_id: account.id,
    asset: assetKeyOf(asset),
    ...assetMetadataOf(asset, nativeAsset),
    estimated: false,
    status: "confirmed" as const,
  };
  const spendable = { ...entry, amount: (value - locked).toString(), locked: false };
  return locked > 0n
    ? [spendable, { ...entry, amount: locked.toString(), locked: true }]
    : [spendable];
}

async function balancesOf(
  deps: LocalPortfolioDeps,
  account: StoredAccount,
  asset: string | undefined,
): Promise<AccountBalances> {
  const ids = { network: account.network, account_id: account.id };
  if (account.status === "registration_failure") {
    return { type: "failure", ...ids, error: account.error ?? "Registration failure" };
  }
  const local = localAccountOf(deps, account);
  if (!local) {
    return { type: "failure", ...ids, error: `${account.network} is not served locally` };
  }
  const { network, data } = local;
  const balances = await network.accountModule.getBalances(network.context, data);
  const items = balances
    .flatMap(balance => entriesOf(account, balance, network.nativeAsset))
    .filter(entry => asset === undefined || entry.asset === asset);
  return { type: "success", ...ids, items };
}

export async function getPortfolioBalance(
  deps: LocalPortfolioDeps,
  portfolioId: string,
  query: BalanceQuery = {},
): Promise<PageView<AccountBalances>> {
  const portfolio = await requirePortfolio(deps.store, portfolioId);
  const accounts = inOrder(
    accountsMatching(portfolio.accounts, query),
    (a, b) => a.id.localeCompare(b.id),
    query.order ?? "ASC",
  );
  const balances = await Promise.all(
    accounts.map(account => balancesOf(deps, account, query.asset)),
  );
  return pageFrom(balances, query, DEFAULT_SIZE);
}
