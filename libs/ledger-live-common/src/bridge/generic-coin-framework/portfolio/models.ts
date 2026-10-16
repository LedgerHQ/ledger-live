import isEqual from "lodash/isEqual";
import { FEE_INCLUSIVE_OPERATION_TYPES } from "@ledgerhq/account-module-framework";
import type {
  AssetInfo,
  Balance,
  Operation as CoreOperation,
  Stake,
  StakeState,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/types";
import type { AccountUtxo } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import {
  assetKeyOf,
  type BalanceEntry,
  type ErrorView,
  type OperationView,
  type StakeInfo,
  type TransactionValidationView,
  type UtxoView,
} from "@ledgerhq/portfolio-module-framework";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { reviveError } from "./errors";

/** The network's balance list, rebuilt from balance entries, and the catalog ids the service told. */
export type ChainBalances = {
  balances: Balance[];
  /** The `cal_id` of each asset key, from the entries that carry no `asset_info` (the service's). */
  calIds: Map<string, string>;
};

/** The five states of a stake, from the four of the service form. */
const SERVICE_STAKE_STATES: Record<StakeInfo["state"], StakeState> = {
  active: "active",
  unstaking: "deactivating",
  inactive: "inactive",
  withdrawn: "withdrawable",
};

/**
 * The stake an entry carries. With `position` (the local implementations), exactly the network's:
 * its uid, five states, actions and asset, and the fields the service form defaults only when the
 * network reported them. Without (the service), what the service form tells: a uid of its address,
 * delegate and state, no actions, and an empty delegate or creation date as absent.
 */
export function stakeFromInfo(info: StakeInfo, asset: AssetInfo = { type: "native" }): Stake {
  const { position } = info;
  const stateUpdatedAt =
    info.state_updated_at === undefined ? {} : { stateUpdatedAt: new Date(info.state_updated_at) };
  if (position) {
    const reported = new Set(position.reported);
    return {
      uid: position.uid,
      address: info.address,
      state: position.state,
      actions: [...position.actions],
      asset: position.asset_info as AssetInfo,
      amount: BigInt(info.amount),
      ...stateUpdatedAt,
      ...(reported.has("delegate") ? { delegate: info.delegate } : {}),
      ...(reported.has("created_at") ? { createdAt: new Date(info.created_at) } : {}),
      ...(reported.has("amount_deposited")
        ? { amountDeposited: BigInt(info.amount_deposited) }
        : {}),
      ...(reported.has("amount_rewarded") ? { amountRewarded: BigInt(info.amount_rewarded) } : {}),
      ...(position.details === undefined ? {} : { details: position.details }),
    };
  }
  return {
    uid: `${info.address}:${info.delegate}:${info.state}`,
    address: info.address,
    state: SERVICE_STAKE_STATES[info.state],
    actions: [],
    asset,
    amount: BigInt(info.amount),
    amountDeposited: BigInt(info.amount_deposited),
    amountRewarded: BigInt(info.amount_rewarded),
    ...stateUpdatedAt,
    ...(info.delegate ? { delegate: info.delegate } : {}),
    ...(info.created_at ? { createdAt: new Date(info.created_at) } : {}),
  };
}

const sum = (items: BalanceEntry[]): bigint =>
  items.reduce((total, { amount }) => total + BigInt(amount), 0n);

/** One balance from the entries splitting it: the sum of their amounts, the locked ones locked. */
function balanceOf(asset: AssetInfo, entries: BalanceEntry[]): Balance {
  const locked = entries.filter(entry => entry.locked);
  const staked = entries.find(({ stake }) => stake !== undefined)?.stake;
  return {
    value: sum(entries),
    asset,
    ...(locked.length > 0 ? { locked: sum(locked) } : {}),
    ...(staked ? { stake: stakeFromInfo(staked, asset) } : {}),
  };
}

/** Groups in the order their first item comes. */
function groupBy<T, K>(items: T[], keyOf: (item: T) => K, same: (a: K, b: K) => boolean) {
  const groups: { key: K; items: T[] }[] = [];
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.find(candidate => same(candidate.key, key));
    if (group) group.items.push(item);
    else groups.push({ key, items: [item] });
  }
  return groups;
}

/**
 * The network's balance list. Entries carrying `balance_index` and `asset_info` (the local
 * implementations) rebuild it exactly, in its order: one balance per index, its asset as the chain
 * names it, the stake of its spendable entry. Without (the service): the native entries sharing a
 * stake as one balance, the stake-free one first (the account's own), each staked one beside it;
 * then one balance per token asset, its catalog id kept in `calIds`.
 */
export function balancesFromEntries(entries: BalanceEntry[]): ChainBalances {
  const calIds = new Map<string, string>();
  if (entries.every(({ balance_index, asset_info }) => balance_index !== undefined && asset_info)) {
    const groups = groupBy(entries, ({ balance_index }) => balance_index as number, Object.is);
    const balances = groups
      .sort((a, b) => a.key - b.key)
      .map(({ items }) => balanceOf(items[0].asset_info as AssetInfo, items));
    return { balances, calIds };
  }

  const native = groupBy(
    entries.filter(({ asset }) => asset === "native"),
    ({ stake }) => stake,
    isEqual,
  ).sort((a, b) => Number(a.key !== undefined) - Number(b.key !== undefined));
  const tokens = groupBy(
    entries.filter(({ asset }) => asset !== "native"),
    ({ asset }) => asset,
    Object.is,
  );
  for (const { key, items } of tokens) {
    const calId = items.find(({ cal_id }) => cal_id)?.cal_id;
    if (calId) calIds.set(key, calId);
  }
  return {
    balances: [
      ...native.map(({ items }) => balanceOf({ type: "native" }, items)),
      ...tokens.map(({ key, items }) => balanceOf({ type: "token", assetReference: key }, items)),
    ],
    calIds,
  };
}

const DECIMAL = /^-?\d+$/;

/**
 * The details of an operation that went through JSON, its stake amount a bigint again: the coin
 * module answers one, which the adapter reads (a decimal string would read as 0).
 */
function withStakeAmount(details: Record<string, unknown>): Record<string, unknown> {
  const { stake } = details;
  if (typeof stake !== "object" || stake === null || Array.isArray(stake)) return details;
  const { amount } = stake as { amount?: unknown };
  return typeof amount === "string" && DECIMAL.test(amount)
    ? { ...details, stake: { ...stake, amount: BigInt(amount) } }
    : details;
}

/**
 * The coin module operation an `OperationView` records: its value without the fee the account module
 * counted in (a native, successful operation of a fee-inclusive type), its details as the module
 * gave them (a module's own `details.memo` included, as the legacy path reads it), who paid the fee,
 * and a block of height 0 for one in no block.
 */
export function coreOperationFromView(op: OperationView): CoreOperation {
  const fees = BigInt(op.fee);
  const value = BigInt(op.value);
  const date = new Date(op.date);
  const countsFee =
    !op.failed && op.asset.type === "native" && FEE_INCLUSIVE_OPERATION_TYPES.has(op.type);
  return {
    id: op.id,
    type: op.type,
    senders: op.senders,
    recipients: op.recipients,
    value: countsFee ? value - fees : value,
    asset: op.asset as AssetInfo,
    ...(op.details === undefined ? {} : { details: withStakeAmount(op.details) }),
    tx: {
      hash: op.hash,
      block: op.block
        ? { height: op.block.height, hash: op.block.hash, time: new Date(op.block.time) }
        : { height: 0, hash: "", time: date },
      fees,
      ...(op.feesPayer === undefined ? {} : { feesPayer: op.feesPayer }),
      date,
      failed: op.failed,
    },
  };
}

/**
 * The token lookup of a sync: an asset whose catalog id the service told is that token; any other
 * is looked up as on the legacy path (`getTokenFromAsset`), which tells apart two tokens sharing a
 * code by their issuer.
 */
export function withCalIds(
  lookup: ((asset: AssetInfo) => Promise<TokenCurrency | undefined>) | undefined,
  calIds: ReadonlyMap<string, string>,
): (asset: AssetInfo) => Promise<TokenCurrency | undefined> {
  return async asset => {
    const calId = calIds.get(assetKeyOf(asset));
    if (calId) return getCryptoAssetsStore().findTokenById(calId);
    return lookup?.(asset);
  };
}

const revived = (views: Record<string, ErrorView>, family: string | undefined) =>
  Object.fromEntries(
    Object.entries(views).map(([field, view]) => [field, reviveError(view, family)]),
  );

/** A validation as the coin module answers it: its errors revived, its amounts bigints. */
export function validationFromView(
  view: TransactionValidationView,
  family?: string,
): TransactionValidation {
  return {
    errors: revived(view.errors, family),
    warnings: revived(view.warnings, family),
    estimatedFees: BigInt(view.estimatedFees),
    ...(view.totalFees === undefined ? {} : { totalFees: BigInt(view.totalFees) }),
    amount: BigInt(view.amount),
    totalSpent: BigInt(view.totalSpent),
  };
}

/** An unspent output as a binding reads it. */
export function fromUtxoView({
  txid,
  vout,
  value,
  address,
  height,
  replaceable,
  change,
}: UtxoView): AccountUtxo {
  return { txid, vout, value: BigInt(value), address, height, replaceable, change };
}
