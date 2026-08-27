import { createWorkletRuntime, scheduleOnRN, scheduleOnRuntime } from "react-native-worklets";
import { isAccountWorkletEnabled } from "./perfOptimizationMode";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import type { Currency } from "@domain/entity-currency";
import type { Account, AccountLike, AssetsDistribution, TokenAccount } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";

export type AccountSnapshot = {
  id: string;
  value: number;
  tokenId: string | null;
  currencyId: string;
  balance: number;
  pendingCount: number;
  swapCount: number;
  subAccounts?: AccountSnapshot[];
};

export type RankAccountsInput = {
  snapshots: AccountSnapshot[];
  excludedTokenIds: string[];
};

export type RankedCurrencyGroup = {
  currencyId: string;
  ids: string[];
  value: number;
};

export type RankAccountsResult = {
  ids: string[];
  hashes: string[];
  groups: RankedCurrencyGroup[];
};

type AccountWorkletRuntime = ReturnType<typeof createWorkletRuntime>;

let cachedRuntime: AccountWorkletRuntime | null | undefined;

export function shouldRankAccountsOnJsThread(): boolean {
  if (typeof process !== "undefined" && Boolean(process.env.JEST_WORKER_ID)) {
    return true;
  }
  return !isAccountWorkletEnabled();
}

export function snapshotAccountLike(
  account: AccountLike,
  countervalueState: CounterValuesState,
  toCurrency: Currency,
  includeSubAccounts = true,
): AccountSnapshot {
  const currency = getAccountCurrency(account);
  const value =
    calculate(countervalueState, {
      value: account.balance.toNumber(),
      from: currency,
      to: toCurrency,
      disableRounding: true,
    }) ?? 0;

  const snapshot: AccountSnapshot = {
    id: account.id,
    value,
    tokenId: account.type === "TokenAccount" ? account.token.id : null,
    currencyId: currency.id,
    balance: account.balance.toNumber(),
    pendingCount: account.pendingOperations.length,
    swapCount: account.swapHistory.length,
  };

  if (
    includeSubAccounts &&
    account.type === "Account" &&
    account.subAccounts &&
    account.subAccounts.length > 0
  ) {
    snapshot.subAccounts = account.subAccounts.map(sub =>
      snapshotAccountLike(sub, countervalueState, toCurrency, false),
    );
  }

  return snapshot;
}

let snapshotCache: {
  accounts: unknown;
  countervalueState: unknown;
  toCurrency: unknown;
  includeSubAccounts: boolean;
  snapshots: AccountSnapshot[];
} | null = null;

export function snapshotAccountsForRanking(
  accounts: Array<Account | TokenAccount | AccountLike>,
  countervalueState: CounterValuesState,
  toCurrency: Currency,
  includeSubAccounts = true,
): AccountSnapshot[] {
  if (
    snapshotCache &&
    snapshotCache.accounts === accounts &&
    snapshotCache.countervalueState === countervalueState &&
    snapshotCache.toCurrency === toCurrency &&
    snapshotCache.includeSubAccounts === includeSubAccounts
  ) {
    return snapshotCache.snapshots;
  }
  const snapshots = accounts.map(account =>
    snapshotAccountLike(account, countervalueState, toCurrency, includeSubAccounts),
  );
  snapshotCache = { accounts, countervalueState, toCurrency, includeSubAccounts, snapshots };
  return snapshots;
}

export function rankAccountSnapshots(input: RankAccountsInput): RankAccountsResult {
  "worklet";
  const flat: AccountSnapshot[] = [];
  const snapshots = input.snapshots;
  for (let i = 0; i < snapshots.length; i++) {
    const parent = snapshots[i];
    flat.push(parent);
    const subs = parent.subAccounts;
    if (subs) {
      for (let j = 0; j < subs.length; j++) {
        flat.push(subs[j]);
      }
    }
  }

  const hashes: string[] = [];
  for (let i = 0; i < flat.length; i++) {
    const account = flat[i];
    hashes.push(
      `${account.id}-${account.balance}-swapHistory(${account.swapCount})-pending(${account.pendingCount})`,
    );
  }

  const excluded: { [tokenId: string]: number } = {};
  const excludedTokenIds = input.excludedTokenIds;
  for (let i = 0; i < excludedTokenIds.length; i++) {
    excluded[excludedTokenIds[i]] = 1;
  }

  const filtered: AccountSnapshot[] = [];
  for (let i = 0; i < flat.length; i++) {
    const account = flat[i];
    if (account.tokenId && excluded[account.tokenId]) {
      continue;
    }
    filtered.push(account);
  }

  filtered.sort((a, b) => {
    const diff = b.value - a.value;
    if (diff !== 0) return diff;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const groupMap: { [currencyId: string]: RankedCurrencyGroup } = {};
  const groups: RankedCurrencyGroup[] = [];
  for (let i = 0; i < filtered.length; i++) {
    const account = filtered[i];
    let group = groupMap[account.currencyId];
    if (!group) {
      group = { currencyId: account.currencyId, ids: [], value: 0 };
      groupMap[account.currencyId] = group;
      groups.push(group);
    }
    group.ids.push(account.id);
    group.value += account.value;
  }
  groups.sort((a, b) => b.value - a.value);

  const ids: string[] = [];
  for (let i = 0; i < filtered.length; i++) {
    ids.push(filtered[i].id);
  }

  return { ids, hashes, groups };
}

export function assetsDistributionFromRankedGroups(
  groups: RankedCurrencyGroup[],
  accountsById: Map<string, AccountLike>,
  opts: { showEmptyAccounts?: boolean; hideEmptyTokenAccount?: boolean } = {},
): AssetsDistribution {
  const showEmptyAccounts = opts.showEmptyAccounts ?? false;
  const hideEmptyTokenAccount = opts.hideEmptyTokenAccount ?? false;
  const list: AssetsDistribution["list"] = [];
  let sum = 0;

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const groupedAccounts: AccountLike[] = [];
    let amount = 0;
    for (let j = 0; j < group.ids.length; j++) {
      const account = accountsById.get(group.ids[j]);
      if (!account) continue;
      groupedAccounts.push(account);
      amount += account.balance.toNumber();
    }
    if (groupedAccounts.length === 0) continue;
    const currency = getAccountCurrency(groupedAccounts[0]);
    const isEmpty = amount <= 0;
    if (currency.type === "TokenCurrency") {
      if (hideEmptyTokenAccount && isEmpty) continue;
    } else if (!showEmptyAccounts && isEmpty) {
      continue;
    }
    list.push({
      currency,
      accounts: groupedAccounts,
      amount,
      countervalue: group.value,
      distribution: 0,
    });
    sum += group.value;
  }

  const isAvailable = sum !== 0 || showEmptyAccounts;
  for (const item of list) {
    item.distribution = isAvailable
      ? sum !== 0
        ? (item.countervalue ?? 0) / sum
        : 1 / list.length
      : 0;
  }

  let acc = 0;
  let showFirstCount = 0;
  for (; showFirstCount < 6 && showFirstCount < list.length; showFirstCount++) {
    if (acc > 0.95) break;
    acc += list[showFirstCount].distribution;
  }

  return {
    isAvailable,
    list,
    showFirst: Math.max(6, showFirstCount),
    sum,
  };
}

function rankingInputKey(input: RankAccountsInput): string {
  let key = `${input.excludedTokenIds.join(",")}|`;
  for (let i = 0; i < input.snapshots.length; i++) {
    const snapshot = input.snapshots[i];
    key += `${snapshot.id}:${snapshot.value}:${snapshot.balance};`;
    const subs = snapshot.subAccounts;
    if (subs) {
      for (let j = 0; j < subs.length; j++) {
        key += `${subs[j].id}:${subs[j].value}:${subs[j].balance};`;
      }
    }
  }
  return key;
}

let cachedRankingKey = "";
let cachedRanking: RankAccountsResult | null = null;
let inflightRankingKey = "";
let inflightRanking: Promise<RankAccountsResult> | null = null;

export function countRankedAccountItems(snapshots: AccountSnapshot[]): number {
  let count = 0;
  for (let i = 0; i < snapshots.length; i++) {
    count += 1;
    const subs = snapshots[i].subAccounts;
    if (subs) count += subs.length;
  }
  return count;
}

function getAccountWorkletRuntime(): AccountWorkletRuntime | null {
  if (shouldRankAccountsOnJsThread()) {
    return null;
  }
  if (cachedRuntime !== undefined) {
    return cachedRuntime;
  }
  try {
    cachedRuntime = createWorkletRuntime({ name: "llm-accounts" });
  } catch {
    cachedRuntime = null;
  }
  return cachedRuntime;
}

export function rankAccountSnapshotsOffJs(
  input: RankAccountsInput,
  repeats = 1,
): Promise<RankAccountsResult> {
  const cacheKey = repeats === 1 ? rankingInputKey(input) : "";
  if (cacheKey && cachedRanking && cachedRankingKey === cacheKey) {
    return Promise.resolve(cachedRanking);
  }
  if (cacheKey && inflightRanking && inflightRankingKey === cacheKey) {
    return inflightRanking;
  }

  const runtime = getAccountWorkletRuntime();
  const run = !runtime
    ? Promise.resolve(
        (() => {
          let result = rankAccountSnapshots(input);
          for (let i = 1; i < repeats; i++) {
            result = rankAccountSnapshots(input);
          }
          return result;
        })(),
      )
    : new Promise<RankAccountsResult>(resolve => {
        scheduleOnRuntime(
          runtime,
          (payload: RankAccountsInput, times: number) => {
            "worklet";
            let result = rankAccountSnapshots(payload);
            for (let i = 1; i < times; i++) {
              result = rankAccountSnapshots(payload);
            }
            scheduleOnRN(resolve, result);
          },
          input,
          repeats,
        );
      });

  if (!cacheKey) {
    return run;
  }

  inflightRankingKey = cacheKey;
  inflightRanking = run.then(result => {
    cachedRankingKey = cacheKey;
    cachedRanking = result;
    if (inflightRankingKey === cacheKey) {
      inflightRanking = null;
    }
    return result;
  });
  return inflightRanking;
}

export function makeHeavyAccountSnapshots(
  parentCount: number,
  tokensPerParent: number,
): AccountSnapshot[] {
  const snapshots: AccountSnapshot[] = [];
  for (let i = 0; i < parentCount; i++) {
    const subAccounts: AccountSnapshot[] = [];
    for (let j = 0; j < tokensPerParent; j++) {
      subAccounts.push({
        id: `tok-${i}-${j}`,
        value: ((i * 31 + j * 17) % 10000) + j,
        tokenId: j % 17 === 0 ? `blocked-${j}` : `token-${j % 40}`,
        currencyId: `c-${j % 12}`,
        balance: i * 100 + j,
        pendingCount: j % 3,
        swapCount: j % 5,
      });
    }
    snapshots.push({
      id: `acc-${i}`,
      value: (i * 97) % 50000,
      tokenId: null,
      currencyId: `c-${i % 12}`,
      balance: i * 1000,
      pendingCount: i % 4,
      swapCount: i % 7,
      subAccounts,
    });
  }
  return snapshots;
}

export type RankAccountsBench = {
  itemCount: number;
  jsThreadMs: number;
  workletWallMs: number;
  jsThreadFreeMs: number;
};

function nowMs(): number {
  return globalThis.performance?.now?.() ?? Date.now();
}

export async function benchRankAccounts(
  input: RankAccountsInput,
  repeats = 8,
): Promise<RankAccountsBench> {
  const jsStart = nowMs();
  for (let i = 0; i < repeats; i++) {
    rankAccountSnapshots(input);
  }
  const jsThreadMs = nowMs() - jsStart;

  let jsThreadFreeMs = 0;
  const scheduledAt = nowMs();
  const jsFreed = new Promise<void>(resolve => {
    setTimeout(() => {
      jsThreadFreeMs = nowMs() - scheduledAt;
      resolve();
    }, 0);
  });

  const workletStart = nowMs();
  await rankAccountSnapshotsOffJs(input, repeats);
  const workletWallMs = nowMs() - workletStart;
  await jsFreed;

  return {
    itemCount: countRankedAccountItems(input.snapshots),
    jsThreadMs,
    workletWallMs,
    jsThreadFreeMs,
  };
}
