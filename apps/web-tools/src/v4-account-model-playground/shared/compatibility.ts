/**
 * Compatibility layer: infer account, bridge sync, split into slices, reconstruct.
 * Converts between legacy Account (types-live) and v4 slices (AccountV4, etc.).
 * Balance history is derived from operations + balance (see README: future dedicated API).
 */
import { BigNumber } from "bignumber.js";
import { lastValueFrom } from "rxjs";
import { reduce } from "rxjs/operators";
import {
  encodeAccountId,
  decodeAccountId,
  emptyHistoryCache,
} from "@ledgerhq/live-common/account/index";
import {
  findCryptoCurrencyById,
  getCryptoCurrencyById,
} from "@ledgerhq/live-common/currencies/index";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { makeBridgeCacheSystem } from "@ledgerhq/live-common/bridge/cache";
import {
  getDerivationScheme,
  runDerivationScheme,
  asDerivationMode,
} from "@ledgerhq/coin-framework/derivation";
import { generateHistoryFromOperations } from "@ledgerhq/coin-framework/account/balanceHistoryCache";
import type { Account, TokenAccount, DerivationMode } from "@ledgerhq/types-live";
import type { AccountV4, TokenAccountV4 } from "../data-layer/accounts/schema";
import type { AccountCoinResources } from "../data-layer/accountCoinResources/schema";
import type { StoredOperation } from "../data-layer/operationHistory/schema";
import { storedOperationToLive } from "../data-layer/operationHistory/storedToLive";

const localCache: Record<string, unknown> = {};
export const bridgeCache = makeBridgeCacheSystem({
  saveData(c, d) {
    localCache[c.id] = d;
    return Promise.resolve();
  },
  getData(c) {
    return Promise.resolve(localCache[c.id]);
  },
});

/** Normalize/validate account id (same idea as sync.tsx inferAccountId). */
export function inferAccountId(id: string): string {
  try {
    decodeAccountId(id);
    return id;
  } catch {
    const splitted = id.split(":");
    const findAndEat = (predicate: (str: string) => unknown) => {
      const res = splitted.find(predicate);
      if (typeof res === "string") {
        splitted.splice(splitted.indexOf(res), 1);
        return res;
      }
    };
    const currencyId = findAndEat(s => findCryptoCurrencyById(s));
    if (!currencyId) throw new Error("invalid id: missing currency part");
    const type = "js";
    findAndEat(s => s === "js");
    const version = findAndEat(s => s.match(/^\d+$/)) || "2";
    const derivationMode = asDerivationMode(
      findAndEat(s => {
        try {
          return asDerivationMode(s);
        } catch {
          return undefined;
        }
      }) ?? "",
    );
    if (splitted.length === 0) throw new Error("invalid id: missing xpub or address part");
    if (splitted.length > 1)
      throw new Error("invalid id: couldn't understand xpub/address part: " + splitted.join(" | "));
    const xpubOrAddress = splitted[0];
    return encodeAccountId({ type, version, currencyId, xpubOrAddress, derivationMode });
  }
}

/** Build a minimal Account for bridge.sync (same idea as sync.tsx inferAccount). */
export function inferAccount(id: string): Account {
  const { derivationMode, xpubOrAddress, currencyId } = decodeAccountId(id);
  const currency = getCryptoCurrencyById(currencyId);
  const scheme = getDerivationScheme({
    derivationMode: derivationMode as DerivationMode,
    currency,
  });
  const index = 0;
  const freshAddressPath = runDerivationScheme(scheme, currency, {
    account: index,
    node: 0,
    address: 0,
  });
  return {
    type: "Account",
    id,
    xpub: xpubOrAddress,
    seedIdentifier: xpubOrAddress,
    used: true,
    swapHistory: [],
    derivationMode,
    currency,
    index,
    freshAddress: xpubOrAddress,
    freshAddressPath,
    creationDate: new Date(),
    lastSyncDate: new Date(0),
    blockHeight: 0,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: emptyHistoryCache,
  };
}

/** Full sync via bridge; returns the full Account. */
export async function syncAccountViaBridge(id: string): Promise<Account> {
  const account = inferAccount(id);
  const bridge = getAccountBridge(account);
  await bridgeCache.prepareCurrency(account.currency);
  const syncConfig = { paginationConfig: {}, blacklistedTokenIds: [] as string[] };
  const observable = bridge.sync(account, syncConfig);
  const synced = await lastValueFrom(observable.pipe(reduce((a, f) => f(a), account)));
  return synced;
}

/** Known coin-specific keys on Account (for extraction / reconstruction). */
const COIN_RESOURCE_KEYS = new Set([
  "bitcoinResources",
  "tezosResources",
  "suiResources",
  "solanaResources",
  "cosmosResources",
  "concordiumResources",
  "celoResources",
  "tronResources",
  "polkadotResources",
  "nearResources",
  "multiversxResources",
  "iconResources",
  "cardanoResources",
  "aptosResources",
  "algorandResources",
  "kaspaResources",
  "hederaResources",
  "cantonResources",
  "aleoResources",
]);
const OTHER_ACCOUNT_EXTRA_KEYS = new Set(["nfts"]);

function accountToAccountV4(account: Account): AccountV4 {
  const subAccounts: TokenAccountV4[] | undefined = account.subAccounts?.map(ta => ({
    type: "TokenAccount" as const,
    id: ta.id,
    parentId: ta.parentId,
    tokenId: ta.token.id,
    balance: ta.balance.toString(),
    spendableBalance: ta.spendableBalance.toString(),
    creationDate:
      ta.creationDate instanceof Date ? ta.creationDate.getTime() : Number(ta.creationDate),
    operationsCount: ta.operationsCount,
  }));
  const lastSyncTs =
    account.lastSyncDate instanceof Date
      ? account.lastSyncDate.getTime()
      : typeof account.lastSyncDate === "number"
        ? account.lastSyncDate
        : new Date(account.lastSyncDate).getTime();
  return {
    type: "Account",
    id: account.id,
    derivationMode: account.derivationMode,
    index: account.index,
    freshAddress: account.freshAddress,
    freshAddressPath: account.freshAddressPath,
    currencyId: account.currency.id,
    balance: account.balance.toString(),
    blockHeight: account.blockHeight,
    spendableBalance: account.spendableBalance.toString(),
    feesCurrencyId: account.feesCurrency?.id,
    subAccounts,
    used: account.used,
    creationDate:
      account.creationDate instanceof Date
        ? account.creationDate.getTime()
        : Number(account.creationDate),
    operationsCount: account.operationsCount,
    seedIdentifier: account.seedIdentifier,
    xpub: account.xpub,
    lastSyncDate: lastSyncTs,
    syncHash: account.syncHash,
  };
}

/** Extract coin-specific and other extras from Account into accountCoinResources (all families, including bitcoin). */
function extractAccountCoinResources(account: Account): AccountCoinResources {
  const resources: AccountCoinResources = {};
  for (const key of Array.from(COIN_RESOURCE_KEYS)) {
    if (key in account && (account as Record<string, unknown>)[key] !== undefined) {
      resources[key] = (account as Record<string, unknown>)[key];
    }
  }
  for (const key of Array.from(OTHER_ACCOUNT_EXTRA_KEYS)) {
    if (key in account && (account as Record<string, unknown>)[key] !== undefined) {
      resources[key] = (account as Record<string, unknown>)[key];
    }
  }
  return resources;
}

export interface SliceUpdates {
  accountV4: AccountV4;
  operations: Account["operations"];
  pendingOperations: Account["pendingOperations"];
  balanceHistory: Account["balanceHistoryCache"];
  accountCoinResources: AccountCoinResources;
  tokenAccountIds: string[];
}

/**
 * Split a full Account into per-slice updates (for dispatch).
 * operationHistory is flat: main account ops + each token account ops
 * are stored by their accountId in the same byAccountId map.
 */
export function splitAccountIntoSliceUpdates(account: Account): SliceUpdates {
  const accountV4 = accountToAccountV4(account);
  const accountCoinResources = extractAccountCoinResources(account);
  const tokenAccountIds = (account.subAccounts || []).map(ta => ta.id);
  return {
    accountV4,
    operations: account.operations || [],
    pendingOperations: account.pendingOperations || [],
    balanceHistory: account.balanceHistoryCache,
    accountCoinResources,
    tokenAccountIds,
  };
}

/**
 * Bundle of slice data for reconstruction (sync selector output).
 * All coin-specific data (including bitcoin) lives in accountCoinResources.
 */
export interface AccountReconstructionInput {
  accountV4: AccountV4;
  operations: StoredOperation[];
  pendingOperations: StoredOperation[];
  balanceHistory: Account["balanceHistoryCache"];
  accountCoinResources: AccountCoinResources;
}

/** Resolve feesCurrencyId to CryptoCurrency or TokenCurrency (try currency first, then token). */
async function resolveFeesCurrency(
  feesCurrencyId: string | undefined,
): Promise<Account["feesCurrency"]> {
  if (!feesCurrencyId) return undefined;
  try {
    return getCryptoCurrencyById(feesCurrencyId);
  } catch {
    return getCryptoAssetsStore().findTokenById(feesCurrencyId) ?? undefined;
  }
}

/**
 * Reconstruct full Account from sync selector output (StoredOperation[] → Operation[] inside).
 * Use this when you have selectAccountReconstructionInput(state, accountId).
 */
export async function reconstructAccountFromReconstructionInput(
  input: AccountReconstructionInput,
): Promise<Account> {
  return reconstructAccountFromSlices(
    input.accountV4,
    input.operations.map(storedOperationToLive),
    input.pendingOperations.map(storedOperationToLive),
    input.balanceHistory,
    input.accountCoinResources,
  );
}

/** Reconstruct full Account from slices (for bridge when needed). Lookup currency/token by id. */
export async function reconstructAccountFromSlices(
  accountV4: AccountV4,
  operations: Account["operations"],
  pendingOperations: Account["pendingOperations"],
  balanceHistory: Account["balanceHistoryCache"],
  accountCoinResources: AccountCoinResources,
): Promise<Account> {
  const currency = getCryptoCurrencyById(accountV4.currencyId);
  const feesCurrency = await resolveFeesCurrency(accountV4.feesCurrencyId);
  const tokenStore = getCryptoAssetsStore();
  const subAccounts: TokenAccount[] | undefined = accountV4.subAccounts
    ? await Promise.all(
        accountV4.subAccounts.map(async ta => {
          const token = await tokenStore.findTokenById(ta.tokenId);
          if (!token)
            throw new Error(
              `reconstructAccountFromSlices: token not found for tokenId ${ta.tokenId}`,
            );
          return {
            type: "TokenAccount" as const,
            id: ta.id,
            parentId: ta.parentId,
            token,
            balance: new BigNumber(ta.balance),
            spendableBalance: new BigNumber(ta.spendableBalance),
            creationDate: new Date(ta.creationDate as number),
            operationsCount: ta.operationsCount,
            operations: [] as Account["operations"],
            pendingOperations: [] as Account["pendingOperations"],
            balanceHistoryCache: emptyHistoryCache,
            swapHistory: [],
          };
        }),
      )
    : undefined;
  const account: Account = {
    type: "Account",
    id: accountV4.id,
    seedIdentifier: accountV4.seedIdentifier,
    xpub: accountV4.xpub,
    derivationMode: accountV4.derivationMode as DerivationMode,
    index: accountV4.index,
    freshAddress: accountV4.freshAddress,
    freshAddressPath: accountV4.freshAddressPath,
    used: accountV4.used,
    balance: new BigNumber(accountV4.balance),
    spendableBalance: new BigNumber(accountV4.spendableBalance),
    creationDate: new Date(accountV4.creationDate as number),
    blockHeight: accountV4.blockHeight,
    currency,
    feesCurrency,
    operationsCount: accountV4.operationsCount,
    operations,
    pendingOperations: pendingOperations || [],
    lastSyncDate: new Date(accountV4.lastSyncDate as number),
    subAccounts,
    balanceHistoryCache: balanceHistory,
    swapHistory: [],
    syncHash: accountV4.syncHash,
  };
  for (const key of Object.keys(accountCoinResources)) {
    (account as Record<string, unknown>)[key] = accountCoinResources[key];
  }
  return account;
}

/**
 * Derive balance history from operations + balance (placeholder; see README).
 * In the future this will be a dedicated balance history API.
 */
export function deriveBalanceHistoryFromOperations(
  balance: Account["balance"],
  operations: Account["operations"],
  _accountId: string,
): Account["balanceHistoryCache"] {
  const accountLike = {
    balance,
    operations: operations || [],
    pendingOperations: [] as Account["pendingOperations"],
    balanceHistoryCache: emptyHistoryCache,
  };
  return generateHistoryFromOperations(accountLike as unknown as Account);
}
