import { toJsonSafe } from "@ledgerhq/account-module-framework";
import type {
  AssetInfo,
  Balance,
  Stake,
  StakeState,
} from "@ledgerhq/coin-module-framework/api/types";
import {
  assetKeyOf,
  type AccountBalances,
  type AssetInfoView,
  type BalanceEntry,
  type BalanceQuery,
  type ChainAssetView,
  type JsonObject,
  type PageView,
  type StakeInfo,
  type StakePositionView,
} from "@ledgerhq/portfolio-module-framework";
import { assetResolver, type ResolvedMetadata } from "./assets";
import { accountsMatching, inOrder, pageFrom } from "./query";
import { localAccountOf, requirePortfolio } from "./stored";
import type { LocalPortfolioDeps, StoredAccount } from "./types";

const DEFAULT_SIZE = 20;

const STAKE_STATES: Record<StakeState, StakeInfo["state"]> = {
  activating: "active",
  active: "active",
  deactivating: "unstaking",
  withdrawable: "inactive",
  inactive: "inactive",
};

/** The stake as the network reports it: what the service form folds or defaults. */
export function toStakePosition(stake: Stake): StakePositionView {
  const reported: StakePositionView["reported"] = [
    ...(stake.delegate === undefined ? [] : (["delegate"] as const)),
    ...(stake.amountDeposited === undefined ? [] : (["amount_deposited"] as const)),
    ...(stake.amountRewarded === undefined ? [] : (["amount_rewarded"] as const)),
    ...(stake.createdAt === undefined ? [] : (["created_at"] as const)),
  ];
  return {
    uid: stake.uid,
    state: stake.state,
    actions: [...stake.actions],
    asset_info: toJsonSafe(stake.asset) as AssetInfoView,
    reported,
    ...(stake.details === undefined ? {} : { details: toJsonSafe(stake.details) as JsonObject }),
  };
}

/**
 * The service form of a stake (without its deposited part, everything not rewarded was
 * deposited), and in `position` the stake as the network reports it.
 */
export function toStakeInfo(stake: Stake): StakeInfo {
  const rewarded = stake.amountRewarded ?? 0n;
  return {
    address: stake.address,
    delegate: stake.delegate ?? "",
    state: STAKE_STATES[stake.state],
    amount: stake.amount.toString(),
    amount_deposited: (stake.amountDeposited ?? stake.amount - rewarded).toString(),
    amount_rewarded: rewarded.toString(),
    ...(stake.stateUpdatedAt ? { state_updated_at: stake.stateUpdatedAt.toISOString() } : {}),
    created_at: stake.createdAt ? stake.createdAt.toISOString() : "",
    position: toStakePosition(stake),
  };
}

/** The asset as its chain names it; name and unit are the entry's own fields. */
const chainAsset = (asset: AssetInfo): ChainAssetView => {
  const { assetReference, assetOwner } = asset as ChainAssetView;
  return {
    type: asset.type,
    ...(assetReference ? { assetReference } : {}),
    ...(assetOwner ? { assetOwner } : {}),
  };
};

/**
 * The entries of the balance at `index` of the network's list: the spendable one, carrying the
 * stake, and the locked one when part of it is locked.
 */
function entriesOf(
  account: StoredAccount,
  { asset, value, locked = 0n, stake }: Balance,
  index: number,
  metadata: ResolvedMetadata,
): BalanceEntry[] {
  const base = {
    network: account.network,
    account_id: account.id,
    asset: assetKeyOf(asset),
    asset_info: chainAsset(asset),
    balance_index: index,
    ...metadata,
    estimated: false,
    status: "confirmed" as const,
  };
  const spendable = {
    ...base,
    amount: (value - locked).toString(),
    locked: false,
    ...(stake ? { stake: toStakeInfo(stake) } : {}),
  };
  return locked > 0n
    ? [spendable, { ...base, amount: locked.toString(), locked: true }]
    : [spendable];
}

async function balancesOf(
  deps: LocalPortfolioDeps,
  portfolioId: string,
  account: StoredAccount,
  asset: string | undefined,
): Promise<AccountBalances> {
  const ids = { network: account.network, account_id: account.id };
  if (account.status === "registration_failure") {
    return { type: "failure", ...ids, error: account.error ?? "Registration failure" };
  }
  const local = localAccountOf(deps, portfolioId, account);
  if (!local) {
    return { type: "failure", ...ids, error: `${account.network} is not served locally` };
  }
  const { network, data } = local;
  const { value: balances } = await network.accountModule.getBalances(network.context, data);
  const resolve = assetResolver(network);
  const entries = await Promise.all(
    balances.map(async (balance, index) =>
      entriesOf(account, balance, index, await resolve(balance.asset)),
    ),
  );
  const items = entries.flat().filter(entry => asset === undefined || entry.asset === asset);
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
    accounts.map(account => balancesOf(deps, portfolioId, account, query.asset)),
  );
  return pageFrom(balances, query, DEFAULT_SIZE);
}
