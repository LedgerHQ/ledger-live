import { readHistory, type AccountOperation } from "@ledgerhq/account-module-framework";
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type {
  BalanceHistoryPoint,
  BalanceHistoryQuery,
  PageView,
} from "@ledgerhq/portfolio-module-framework";
import { assetKeyOf, assetMetadataOf, sumByAsset, type AssetBalance } from "./assets";
import { accountsMatching, inOrder, pageFrom } from "./query";
import { balancesAt, sampleTimes } from "./sampling";
import { localAccountOf, requirePortfolio, type LocalAccount } from "./stored";
import type { LocalPortfolioDeps, StoredAccount } from "./types";

const DEFAULT_SIZE = 20;

type Series = { asset: AssetInfo; current: bigint; operations: AccountOperation[] };

/** One series per asset with a balance or an operation; operations stay newest first. */
function seriesOf(balances: Map<string, AssetBalance>, operations: AccountOperation[]) {
  const series = new Map<string, Series>();
  for (const [key, { asset, value }] of balances) {
    series.set(key, { asset, current: value, operations: [] });
  }
  for (const operation of operations) {
    const key = assetKeyOf(operation.asset);
    const entry = series.get(key) ?? { asset: operation.asset, current: 0n, operations: [] };
    entry.operations.push(operation);
    series.set(key, entry);
  }
  return series;
}

async function pointsOf(
  account: StoredAccount,
  { network, data }: LocalAccount,
  query: BalanceHistoryQuery,
  now: number,
): Promise<BalanceHistoryPoint[]> {
  const [balances, operations] = await Promise.all([
    network.accountModule.getBalances(network.context, data),
    readHistory(data.history),
  ]);
  return [...seriesOf(sumByAsset(balances), operations)]
    .filter(([key]) => query.asset === undefined || key === query.asset)
    .flatMap(([key, series]) => {
      const oldest = series.operations.at(-1)?.date.getTime();
      const times = sampleTimes(query.range ?? "day", now, oldest);
      const values = balancesAt(times, series.current, series.operations);
      const metadata = assetMetadataOf(series.asset, network.nativeAsset);
      return times.map((time, index) => ({
        network: account.network,
        account_id: account.id,
        asset: key,
        ...metadata,
        time: new Date(time).toISOString(),
        value: values[index].toString(),
      }));
    });
}

const comparePoints = (a: BalanceHistoryPoint, b: BalanceHistoryPoint) =>
  a.time.localeCompare(b.time) ||
  a.account_id.localeCompare(b.account_id) ||
  a.asset.localeCompare(b.asset);

export async function getPortfolioBalanceHistory(
  deps: LocalPortfolioDeps,
  portfolioId: string,
  query: BalanceHistoryQuery = {},
): Promise<PageView<BalanceHistoryPoint>> {
  const portfolio = await requirePortfolio(deps.store, portfolioId);
  const now = deps.now();
  const perAccount = await Promise.all(
    accountsMatching(portfolio.accounts, query).map(account => {
      const failed = account.status === "registration_failure";
      const local = failed ? undefined : localAccountOf(deps, account);
      return local ? pointsOf(account, local, query, now) : [];
    }),
  );
  return pageFrom(
    inOrder(perAccount.flat(), comparePoints, query.order ?? "ASC"),
    query,
    DEFAULT_SIZE,
  );
}
