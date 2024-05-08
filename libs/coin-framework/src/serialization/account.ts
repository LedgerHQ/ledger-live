import { BigNumber } from "bignumber.js";
import type {
  Account,
  AccountBridge,
  AccountRaw,
  Operation,
  OperationRaw,
  SubAccount,
  TokenAccount,
  TokenAccountRaw,
  TransactionCommon,
} from "@ledgerhq/types-live";
import {
  findCryptoCurrencyById,
  findTokenById,
  getCryptoCurrencyById,
  getTokenById,
} from "@ledgerhq/cryptoassets/index";
import { emptyHistoryCache, generateHistoryFromOperations } from "../account/balanceHistoryCache";
import { isAccountEmpty } from "../account/helpers";
import { fromNFTRaw, toNFTRaw } from "./nft";
import {
  fromOperationRaw,
  fromSwapOperationRaw,
  toOperationRaw,
  toSwapOperationRaw,
} from "./operation";

export type FromFamiliyRaw = {
  assignFromAccountRaw?: AccountBridge<TransactionCommon>["assignFromAccountRaw"];
  fromOperationExtraRaw?: AccountBridge<TransactionCommon>["fromOperationExtraRaw"];
};

export function fromAccountRaw(rawAccount: AccountRaw, fromRaw?: FromFamiliyRaw): Account {
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

  const convertOperation = (op: OperationRaw) =>
    fromOperationRaw(op, id, subAccounts as SubAccount[], fromRaw?.fromOperationExtraRaw);

  const subAccounts =
    subAccountsRaw &&
    subAccountsRaw
      .map(ta => {
        if (ta.type === "TokenAccountRaw") {
          if (findTokenById(ta.tokenId)) {
            return fromTokenAccountRaw(ta);
          }
        }
      })
      .filter(Boolean);
  const currency = getCryptoCurrencyById(currencyId);
  const feesCurrency =
    (feesCurrencyId && (findCryptoCurrencyById(feesCurrencyId) || findTokenById(feesCurrencyId))) ||
    undefined;

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
    operations: (operations || []).map(convertOperation),
    operationsCount: operationsCount || (operations && operations.length) || 0,
    pendingOperations: (pendingOperations || []).map(convertOperation),
    currency,
    feesCurrency,
    lastSyncDate: new Date(lastSyncDate || 0),
    swapHistory: [],
    syncHash,
    balanceHistoryCache: balanceHistoryCache || emptyHistoryCache,
    nfts: nfts?.map(n => fromNFTRaw(n)),
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
    res.subAccounts = subAccounts as SubAccount[];
  }

  if (fromRaw?.assignFromAccountRaw) {
    fromRaw.assignFromAccountRaw(rawAccount, res);
  }

  if (swapHistory) {
    res.swapHistory = swapHistory.map(fromSwapOperationRaw);
  }

  return res;
}

export type ToFamiliyRaw = {
  assignToAccountRaw?: AccountBridge<TransactionCommon>["assignToAccountRaw"];
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
    lastSyncDate,
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
    operations: (operations || []).map(convertOperation),
    pendingOperations: (pendingOperations || []).map(convertOperation),
    currencyId: currency.id,
    lastSyncDate: lastSyncDate.toISOString(),
    balance: balance.toFixed(),
    spendableBalance: spendableBalance.toFixed(),
    nfts: nfts?.map(n => toNFTRaw(n)),
  };

  if (feesCurrency) {
    res.feesCurrencyId = feesCurrency.id;
  }

  if (balanceHistoryCache) {
    res.balanceHistoryCache = balanceHistoryCache;
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

  if (swapHistory) {
    res.swapHistory = swapHistory.map(toSwapOperationRaw);
  }

  return res;
}

//-- TokenAccount

function fromTokenAccountRaw(
  raw: TokenAccountRaw,
  fromOperationExtraRaw?: AccountBridge<TransactionCommon>["fromOperationExtraRaw"],
): TokenAccount {
  const {
    id,
    parentId,
    tokenId,
    starred,
    operations,
    pendingOperations,
    creationDate,
    balance,
    spendableBalance,
    balanceHistoryCache,
    swapHistory,
    approvals,
  } = raw;
  const token = getTokenById(tokenId);

  const convertOperation = (op: OperationRaw) =>
    fromOperationRaw(op, id, null, fromOperationExtraRaw);

  const res = {
    type: "TokenAccount",
    id,
    parentId,
    token,
    starred: starred || false,
    balance: new BigNumber(balance),
    spendableBalance: spendableBalance ? new BigNumber(spendableBalance) : new BigNumber(balance),
    creationDate: new Date(creationDate || Date.now()),
    operationsCount: raw.operationsCount || (operations && operations.length) || 0,
    operations: (operations || []).map(convertOperation),
    pendingOperations: (pendingOperations || []).map(convertOperation),
    swapHistory: (swapHistory || []).map(fromSwapOperationRaw),
    approvals,
    balanceHistoryCache: balanceHistoryCache || emptyHistoryCache,
  };
  res.balanceHistoryCache = generateHistoryFromOperations(res as TokenAccount);
  return res as TokenAccount;
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
    approvals,
  } = ta;

  const convertOperation = (op: Operation) => toOperationRaw(op, undefined, toOperationExtraRaw);

  return {
    type: "TokenAccountRaw",
    id,
    parentId,
    tokenId: token.id,
    balance: balance.toString(),
    spendableBalance: spendableBalance.toString(),
    balanceHistoryCache,
    creationDate: ta.creationDate.toISOString(),
    operationsCount,
    operations: operations.map(convertOperation),
    pendingOperations: pendingOperations.map(convertOperation),
    swapHistory: (swapHistory || []).map(toSwapOperationRaw),
    approvals,
  };
}
