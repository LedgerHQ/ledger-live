import { BigNumber } from "bignumber.js";
import type {
  Account,
  AccountBridge,
  AccountRaw,
  Operation,
  OperationRaw,
  TokenAccount,
  TokenAccountRaw,
  TransactionCommon,
} from "@ledgerhq/types-live";
import { findCryptoCurrencyById, getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { emptyHistoryCache, generateHistoryFromOperations } from "../account/balanceHistoryCache";
import {
  compressBalanceHistoryCache,
  decompressBalanceHistoryCache,
} from "../account/balanceHistoryCacheCompression";
import { isAccountEmpty } from "../account/helpers";
import { fromNFTRaw, toNFTRaw } from "./nft";
import {
  fromOperationRaw,
  fromSwapOperationRaw,
  toOperationRaw,
  toSwapOperationRaw,
} from "./operation";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import invariant from "invariant";

export type FromFamiliyRaw = {
  assignFromAccountRaw?: AccountBridge<TransactionCommon>["assignFromAccountRaw"];
  assignFromTokenAccountRaw?: AccountBridge<TransactionCommon>["assignFromTokenAccountRaw"];
  fromOperationExtraRaw?: AccountBridge<TransactionCommon>["fromOperationExtraRaw"];
};

export async function fromAccountRaw(
  rawAccount: AccountRaw,
  fromRaw?: FromFamiliyRaw,
): Promise<Account> {
  const {
    id,
    seedIdentifier,
    derivationMode,
    index,
    xpub,
    used,
    freshAddress,
    freshAddressPath,
    blockHeight,
    currencyId,
    feesCurrencyId,
    operations,
    operationsCount,
    pendingOperations,
    lastSyncDate,
    creationDate,
    balance,
    balanceHistoryCache,
    spendableBalance,
    subAccounts: subAccountsRaw,
    swapHistory,
    syncHash,
    nfts,
  } = rawAccount;

  const store = getCryptoAssetsStore();

  // Track if any token lookup fails. Because we need to gracefully degrade to a full synchronization
  let hasTokenLookupFailure = false;

  const subAccounts = subAccountsRaw
    ? await Promise.all(
        subAccountsRaw.map(async ta => {
          if (ta.type === "TokenAccountRaw") {
            // When we load AccountRaw from the DB, we don't want to fail in case bad things happen asynchronously. therefore, we will drop the TokenAccount temporarily to not drop the main account and it will be recovered later.
            const token = await store.findTokenById(ta.tokenId).catch(() => undefined);
            if (token) {
              return await fromTokenAccountRaw(ta);
            } else {
              hasTokenLookupFailure = true;
            }
          }
        }),
      ).then(results => results.filter(Boolean))
    : undefined;

  const convertOperation = (op: OperationRaw) =>
    fromOperationRaw(op, id, subAccounts as TokenAccount[], fromRaw?.fromOperationExtraRaw);

  const currency = getCryptoCurrencyById(currencyId);
  const feesCurrency = feesCurrencyId
    ? findCryptoCurrencyById(feesCurrencyId) || (await store.findTokenById(feesCurrencyId))
    : undefined;

  const res: Account = {
    type: "Account",
    id,
    used: false,
    // filled again below
    seedIdentifier,
    derivationMode,
    index,
    freshAddress,
    freshAddressPath,
    blockHeight,
    creationDate: new Date(creationDate || Date.now()),
    balance: new BigNumber(balance),
    spendableBalance: new BigNumber(spendableBalance || balance),
    // If a token lookup failed, set operations to empty to gracefully degrade
    operations: hasTokenLookupFailure ? [] : (operations || []).map(convertOperation),
    operationsCount: operationsCount || (operations && operations.length) || 0,
    pendingOperations: hasTokenLookupFailure ? [] : (pendingOperations || []).map(convertOperation),
    currency,
    feesCurrency,
    lastSyncDate: new Date(lastSyncDate || 0),
    swapHistory: [],
    syncHash,
    balanceHistoryCache: balanceHistoryCache
      ? decompressBalanceHistoryCache(balanceHistoryCache)
      : emptyHistoryCache,
  };
  res.balanceHistoryCache = generateHistoryFromOperations(res);

  if (typeof used === "undefined") {
    // old account data that didn't had the field yet
    res.used = !isAccountEmpty(res);
  } else {
    res.used = used;
  }

  if (xpub) {
    res.xpub = xpub;
  }

  if (subAccounts) {
    res.subAccounts = subAccounts as TokenAccount[];
  }

  if (swapHistory) {
    res.swapHistory = swapHistory.map(fromSwapOperationRaw);
  }

  if (nfts) {
    res.nfts = nfts.map(n => fromNFTRaw(n));
  }

  if (fromRaw?.assignFromAccountRaw) {
    fromRaw.assignFromAccountRaw(rawAccount, res);
  }

  if (fromRaw?.assignFromTokenAccountRaw && res.subAccounts) {
    res.subAccounts.forEach((subAcc, index) => {
      const subAccRaw = subAccountsRaw?.[index];
      if (subAcc.type === "TokenAccount" && subAccRaw?.type === "TokenAccountRaw") {
        fromRaw.assignFromTokenAccountRaw?.(subAccRaw, subAcc);
      }
    });
  }

  return res;
}

export type ToFamiliyRaw = {
  assignToAccountRaw?: AccountBridge<TransactionCommon>["assignToAccountRaw"];
  assignToTokenAccountRaw?: AccountBridge<TransactionCommon>["assignToTokenAccountRaw"];
  toOperationExtraRaw?: AccountBridge<TransactionCommon>["toOperationExtraRaw"];
};

export function toAccountRaw(account: Account, toFamilyRaw?: ToFamiliyRaw): AccountRaw {
  const {
    id,
    seedIdentifier,
    xpub,
    used,
    derivationMode,
    index,
    freshAddress,
    freshAddressPath,
    blockHeight,
    currency,
    feesCurrency,
    creationDate,
    operationsCount,
    operations,
    pendingOperations,
    balance,
    balanceHistoryCache,
    spendableBalance,
    subAccounts,
    swapHistory,
    syncHash,
    nfts,
  } = account;

  const convertOperation = (op: Operation) =>
    toOperationRaw(op, undefined, toFamilyRaw?.toOperationExtraRaw);

  const res: AccountRaw = {
    id,
    seedIdentifier,
    used,
    derivationMode,
    index,
    freshAddress,
    freshAddressPath,
    blockHeight,
    syncHash,
    creationDate: creationDate.toISOString(),
    operationsCount,
    operations: operations.map(convertOperation),
    pendingOperations: pendingOperations.map(convertOperation),
    currencyId: currency.id,
    balance: balance.toFixed(),
    spendableBalance: spendableBalance.toFixed(),
  };

  if (feesCurrency) {
    res.feesCurrencyId = feesCurrency.id;
  }

  if (balanceHistoryCache) {
    // Compress for storage
    res.balanceHistoryCache = compressBalanceHistoryCache(balanceHistoryCache);
  }

  if (xpub) {
    res.xpub = xpub;
  }

  if (subAccounts) {
    res.subAccounts = subAccounts.map(a => toTokenAccountRaw(a, toFamilyRaw?.toOperationExtraRaw));
  }

  if (toFamilyRaw?.assignToAccountRaw) {
    toFamilyRaw.assignToAccountRaw(account, res);
  }

  if (toFamilyRaw?.assignToTokenAccountRaw && res.subAccounts) {
    res.subAccounts.forEach((subAccRaw, index) => {
      const subAcc = subAccounts?.[index];
      if (subAccRaw.type === "TokenAccountRaw" && subAcc?.type === "TokenAccount") {
        toFamilyRaw.assignToTokenAccountRaw?.(subAcc, subAccRaw);
      }
    });
  }

  if (swapHistory) {
    res.swapHistory = swapHistory.map(toSwapOperationRaw);
  }

  if (nfts) {
    res.nfts = nfts.map(n => toNFTRaw(n));
  }

  return res;
}

//-- TokenAccount

async function fromTokenAccountRaw(
  raw: TokenAccountRaw,
  fromOperationExtraRaw?: AccountBridge<TransactionCommon>["fromOperationExtraRaw"],
): Promise<TokenAccount> {
  const {
    id,
    parentId,
    tokenId,
    operations,
    pendingOperations,
    creationDate,
    balance,
    spendableBalance,
    balanceHistoryCache,
    swapHistory,
  } = raw;
  const store = getCryptoAssetsStore();
  const token = await store.findTokenById(tokenId);
  invariant(token, `Token with id ${tokenId} not found`);

  const convertOperation = (op: OperationRaw) =>
    fromOperationRaw(op, id, null, fromOperationExtraRaw);

  const res: TokenAccount = {
    type: "TokenAccount",
    id,
    parentId,
    token,
    balance: new BigNumber(balance),
    spendableBalance: spendableBalance ? new BigNumber(spendableBalance) : new BigNumber(balance),
    creationDate: new Date(creationDate || Date.now()),
    operationsCount: raw.operationsCount || (operations && operations.length) || 0,
    operations: operations.map(convertOperation),
    pendingOperations: (pendingOperations || []).map(convertOperation),
    swapHistory: swapHistory?.map(fromSwapOperationRaw) || [],
    balanceHistoryCache: balanceHistoryCache
      ? decompressBalanceHistoryCache(balanceHistoryCache)
      : emptyHistoryCache,
  };
  res.balanceHistoryCache = generateHistoryFromOperations(res as TokenAccount);
  return res;
}
function toTokenAccountRaw(
  ta: TokenAccount,
  toOperationExtraRaw?: AccountBridge<TransactionCommon>["toOperationExtraRaw"],
): TokenAccountRaw {
  const {
    id,
    parentId,
    token,
    operations,
    operationsCount,
    pendingOperations,
    balance,
    spendableBalance,
    balanceHistoryCache,
    swapHistory,
  } = ta;

  const convertOperation = (op: Operation) => toOperationRaw(op, undefined, toOperationExtraRaw);

  const res: TokenAccountRaw = {
    type: "TokenAccountRaw",
    id,
    parentId,
    tokenId: token.id,
    balance: balance.toString(),
    spendableBalance: spendableBalance.toString(),
    creationDate: ta.creationDate.toISOString(),
    operationsCount,
    operations: operations.map(convertOperation),
    pendingOperations: pendingOperations.map(convertOperation),
    swapHistory: swapHistory?.map(toSwapOperationRaw),
  };

  if (balanceHistoryCache) {
    res.balanceHistoryCache = compressBalanceHistoryCache(balanceHistoryCache);
  }

  return res;
}
