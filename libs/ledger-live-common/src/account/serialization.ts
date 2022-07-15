import { BigNumber } from "bignumber.js";
import type {
  Account,
  AccountRaw,
  AccountLike,
  AccountRawLike,
  BalanceHistory,
  BalanceHistoryRaw,
  BalanceHistoryMap,
  BalanceHistoryRawMap,
  TokenAccount,
  TokenAccountRaw,
  ChildAccount,
  ChildAccountRaw,
  Operation,
  OperationRaw,
  SubAccount,
  SubAccountRaw,
  ProtoNFT,
  ProtoNFTRaw,
} from "../types";
import type { TronResources, TronResourcesRaw } from "../families/tron/types";
import {
  toBitcoinResourcesRaw,
  fromBitcoinResourcesRaw,
} from "../families/bitcoin/serialization";
import {
  toCosmosResourcesRaw,
  fromCosmosResourcesRaw,
} from "../families/cosmos/serialization";
import {
  toAlgorandResourcesRaw,
  fromAlgorandResourcesRaw,
} from "../families/algorand/serialization";
import {
  toPolkadotResourcesRaw,
  fromPolkadotResourcesRaw,
} from "../families/polkadot/serialization";
import {
  toTezosResourcesRaw,
  fromTezosResourcesRaw,
} from "../families/tezos/serialization";
import {
  toElrondResourcesRaw,
  fromElrondResourcesRaw,
} from "../families/elrond/serialization";
import {
  toCryptoOrgResourcesRaw,
  fromCryptoOrgResourcesRaw,
} from "../families/crypto_org/serialization";

import {
  toSolanaResourcesRaw,
  fromSolanaResourcesRaw,
} from "../families/solana/serialization";

import {
  getCryptoCurrencyById,
  getTokenById,
  findTokenById,
} from "../currencies";
import { inferFamilyFromAccountId } from "./accountId";
import accountByFamily from "../generated/account";
import { isAccountEmpty } from "./helpers";
import type { SwapOperation, SwapOperationRaw } from "../exchange/swap/types";
import {
  emptyHistoryCache,
  generateHistoryFromOperations,
} from "./balanceHistoryCache";
import {
  fromCardanoResourceRaw,
  toCardanoResourceRaw,
} from "../families/cardano/serialization";

export { toCosmosResourcesRaw, fromCosmosResourcesRaw };
export { toAlgorandResourcesRaw, fromAlgorandResourcesRaw };
export { toBitcoinResourcesRaw, fromBitcoinResourcesRaw };
export { toPolkadotResourcesRaw, fromPolkadotResourcesRaw };
export { toTezosResourcesRaw, fromTezosResourcesRaw };
export { toElrondResourcesRaw, fromElrondResourcesRaw };
export { toCryptoOrgResourcesRaw, fromCryptoOrgResourcesRaw };
export { toCardanoResourceRaw, fromCardanoResourceRaw };
export { toSolanaResourcesRaw, fromSolanaResourcesRaw };

export function toBalanceHistoryRaw(b: BalanceHistory): BalanceHistoryRaw {
  return b.map(({ date, value }) => [date.toISOString(), value.toString()]);
}
export function fromBalanceHistoryRaw(b: BalanceHistoryRaw): BalanceHistory {
  return b.map(([date, value]) => ({
    date: new Date(date),
    value: new BigNumber(value),
  }));
}
export function toBalanceHistoryRawMap(
  bhm: BalanceHistoryMap
): BalanceHistoryRawMap {
  const map = {};
  Object.keys(bhm).forEach((range) => {
    map[range] = toBalanceHistoryRaw(bhm[range]);
  });
  return map as BalanceHistoryRawMap;
}
export function fromBalanceHistoryRawMap(
  bhm: BalanceHistoryRawMap
): BalanceHistoryMap {
  const map = {};
  Object.keys(bhm).forEach((range) => {
    map[range] = fromBalanceHistoryRaw(bhm[range]);
  });
  return map as BalanceHistoryMap;
}
export const toOperationRaw = (
  {
    date,
    value,
    fee,
    subOperations,
    internalOperations,
    nftOperations,
    extra,
    id,
    hash,
    type,
    senders,
    recipients,
    blockHeight,
    blockHash,
    transactionSequenceNumber,
    accountId,
    hasFailed,
    contract,
    operator,
    standard,
    tokenId,
  }: Operation,
  preserveSubOperation?: boolean
): OperationRaw => {
  let e = extra;

  if (e) {
    const family = inferFamilyFromAccountId(accountId);

    if (family) {
      const abf = accountByFamily[family];

      if (abf && abf.toOperationExtraRaw) {
        e = abf.toOperationExtraRaw(e);
      }
    }
  }

  const copy: OperationRaw = {
    id,
    hash,
    type,
    senders,
    recipients,
    accountId,
    blockHash,
    blockHeight,
    extra: e,
    date: date.toISOString(),
    value: value.toFixed(),
    fee: fee.toString(),
    contract,
    operator,
    standard,
    tokenId,
  };

  if (transactionSequenceNumber !== undefined) {
    copy.transactionSequenceNumber = transactionSequenceNumber;
  }

  if (hasFailed !== undefined) {
    copy.hasFailed = hasFailed;
  }

  if (subOperations && preserveSubOperation) {
    copy.subOperations = subOperations.map((o) => toOperationRaw(o));
  }

  if (internalOperations) {
    copy.internalOperations = internalOperations.map((o) => toOperationRaw(o));
  }

  if (nftOperations) {
    copy.nftOperations = nftOperations.map((o) => toOperationRaw(o));
  }

  return copy;
};
export const inferSubOperations = (
  txHash: string,
  subAccounts: SubAccount[]
): Operation[] => {
  const all: Operation[] = [];

  for (let i = 0; i < subAccounts.length; i++) {
    const ta = subAccounts[i];

    for (let j = 0; j < ta.operations.length; j++) {
      const op = ta.operations[j];

      if (op.hash === txHash) {
        all.push(op);
      }
    }

    for (let j = 0; j < ta.pendingOperations.length; j++) {
      const op = ta.pendingOperations[j];

      if (op.hash === txHash) {
        all.push(op);
      }
    }
  }

  return all;
};
export const fromOperationRaw = (
  {
    date,
    value,
    fee,
    extra,
    subOperations,
    internalOperations,
    nftOperations,
    id,
    hash,
    type,
    senders,
    recipients,
    blockHeight,
    blockHash,
    transactionSequenceNumber,
    hasFailed,
    contract,
    operator,
    standard,
    tokenId,
  }: OperationRaw,
  accountId: string,
  subAccounts?: SubAccount[] | null | undefined
): Operation => {
  let e = extra;

  if (e) {
    const family = inferFamilyFromAccountId(accountId);

    if (family) {
      const abf = accountByFamily[family];

      if (abf && abf.fromOperationExtraRaw) {
        e = abf.fromOperationExtraRaw(e);
      }
    }
  }

  const res: Operation = {
    id,
    hash,
    type,
    senders,
    recipients,
    accountId,
    blockHash,
    blockHeight,
    date: new Date(date),
    value: new BigNumber(value),
    fee: new BigNumber(fee),
    extra: e || {},
    contract,
    operator,
    standard,
    tokenId,
  };

  if (transactionSequenceNumber !== undefined) {
    res.transactionSequenceNumber = transactionSequenceNumber;
  }

  if (hasFailed !== undefined) {
    res.hasFailed = hasFailed;
  }

  if (subAccounts) {
    res.subOperations = inferSubOperations(hash, subAccounts);
  } else if (subOperations) {
    res.subOperations = subOperations.map((o) =>
      fromOperationRaw(o, o.accountId)
    );
  }

  if (internalOperations) {
    res.internalOperations = internalOperations.map((o) =>
      fromOperationRaw(o, o.accountId)
    );
  }

  if (nftOperations) {
    res.nftOperations = nftOperations.map((o) =>
      fromOperationRaw(o, o.accountId)
    );
  }

  return res;
};
export const toTronResourcesRaw = ({
  frozen,
  delegatedFrozen,
  votes,
  tronPower,
  energy,
  bandwidth,
  unwithdrawnReward,
  lastWithdrawnRewardDate,
  lastVotedDate,
  cacheTransactionInfoById: cacheTx,
}: TronResources): TronResourcesRaw => {
  const frozenBandwidth = frozen.bandwidth;
  const frozenEnergy = frozen.energy;
  const delegatedFrozenBandwidth = delegatedFrozen.bandwidth;
  const delegatedFrozenEnergy = delegatedFrozen.energy;
  const cacheTransactionInfoById = {};

  for (const k in cacheTx) {
    const { fee, blockNumber, withdraw_amount, unfreeze_amount } = cacheTx[k];
    cacheTransactionInfoById[k] = [
      fee,
      blockNumber,
      withdraw_amount,
      unfreeze_amount,
    ];
  }

  return {
    frozen: {
      bandwidth: frozenBandwidth
        ? {
            amount: frozenBandwidth.amount.toString(),
            expiredAt: frozenBandwidth.expiredAt.toISOString(),
          }
        : undefined,
      energy: frozenEnergy
        ? {
            amount: frozenEnergy.amount.toString(),
            expiredAt: frozenEnergy.expiredAt.toISOString(),
          }
        : undefined,
    },
    delegatedFrozen: {
      bandwidth: delegatedFrozenBandwidth
        ? {
            amount: delegatedFrozenBandwidth.amount.toString(),
          }
        : undefined,
      energy: delegatedFrozenEnergy
        ? {
            amount: delegatedFrozenEnergy.amount.toString(),
          }
        : undefined,
    },
    votes,
    tronPower,
    energy: energy.toString(),
    bandwidth: {
      freeUsed: bandwidth.freeUsed.toString(),
      freeLimit: bandwidth.freeLimit.toString(),
      gainedUsed: bandwidth.gainedUsed.toString(),
      gainedLimit: bandwidth.gainedLimit.toString(),
    },
    unwithdrawnReward: unwithdrawnReward.toString(),
    lastWithdrawnRewardDate: lastWithdrawnRewardDate
      ? lastWithdrawnRewardDate.toISOString()
      : undefined,
    lastVotedDate: lastVotedDate ? lastVotedDate.toISOString() : undefined,
    cacheTransactionInfoById,
  };
};
export const fromTronResourcesRaw = ({
  frozen,
  delegatedFrozen,
  votes,
  tronPower,
  energy,
  bandwidth,
  unwithdrawnReward,
  lastWithdrawnRewardDate,
  lastVotedDate,
  cacheTransactionInfoById: cacheTransactionInfoByIdRaw,
}: TronResourcesRaw): TronResources => {
  const frozenBandwidth = frozen.bandwidth;
  const frozenEnergy = frozen.energy;
  const delegatedFrozenBandwidth = delegatedFrozen.bandwidth;
  const delegatedFrozenEnergy = delegatedFrozen.energy;
  const cacheTransactionInfoById = {};

  if (cacheTransactionInfoByIdRaw) {
    for (const k in cacheTransactionInfoByIdRaw) {
      const [fee, blockNumber, withdraw_amount, unfreeze_amount] =
        cacheTransactionInfoByIdRaw[k];
      cacheTransactionInfoById[k] = {
        fee,
        blockNumber,
        withdraw_amount,
        unfreeze_amount,
      };
    }
  }

  return {
    frozen: {
      bandwidth: frozenBandwidth
        ? {
            amount: new BigNumber(frozenBandwidth.amount),
            expiredAt: new Date(frozenBandwidth.expiredAt),
          }
        : undefined,
      energy: frozenEnergy
        ? {
            amount: new BigNumber(frozenEnergy.amount),
            expiredAt: new Date(frozenEnergy.expiredAt),
          }
        : undefined,
    },
    delegatedFrozen: {
      bandwidth: delegatedFrozenBandwidth
        ? {
            amount: new BigNumber(delegatedFrozenBandwidth.amount),
          }
        : undefined,
      energy: delegatedFrozenEnergy
        ? {
            amount: new BigNumber(delegatedFrozenEnergy.amount),
          }
        : undefined,
    },
    votes,
    tronPower,
    energy: new BigNumber(energy),
    bandwidth: {
      freeUsed: new BigNumber(bandwidth.freeUsed),
      freeLimit: new BigNumber(bandwidth.freeLimit),
      gainedUsed: new BigNumber(bandwidth.gainedUsed),
      gainedLimit: new BigNumber(bandwidth.gainedLimit),
    },
    unwithdrawnReward: new BigNumber(unwithdrawnReward),
    lastWithdrawnRewardDate: lastWithdrawnRewardDate
      ? new Date(lastWithdrawnRewardDate)
      : undefined,
    lastVotedDate: lastVotedDate ? new Date(lastVotedDate) : undefined,
    cacheTransactionInfoById,
  };
};
export function fromSwapOperationRaw(raw: SwapOperationRaw): SwapOperation {
  const { fromAmount, toAmount } = raw;
  return {
    ...raw,
    fromAmount: new BigNumber(fromAmount),
    toAmount: new BigNumber(toAmount),
  };
}
export function toSwapOperationRaw(so: SwapOperation): SwapOperationRaw {
  const { fromAmount, toAmount } = so;
  return {
    ...so,
    fromAmount: fromAmount.toString(),
    toAmount: toAmount.toString(),
  };
}
export function fromTokenAccountRaw(raw: TokenAccountRaw): TokenAccount {
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
    compoundBalance,
    balanceHistory,
    balanceHistoryCache,
    swapHistory,
    approvals,
  } = raw;
  const token = getTokenById(tokenId);

  const convertOperation = (op) => fromOperationRaw(op, id);

  const res = {
    type: "TokenAccount",
    id,
    parentId,
    token,
    starred: starred || false,
    balance: new BigNumber(balance),
    spendableBalance: spendableBalance
      ? new BigNumber(spendableBalance)
      : new BigNumber(balance),
    compoundBalance: compoundBalance
      ? new BigNumber(compoundBalance)
      : undefined,
    balanceHistory: balanceHistory
      ? fromBalanceHistoryRawMap(balanceHistory)
      : undefined,
    creationDate: new Date(creationDate || Date.now()),
    operationsCount:
      raw.operationsCount || (operations && operations.length) || 0,
    operations: (operations || []).map(convertOperation),
    pendingOperations: (pendingOperations || []).map(convertOperation),
    swapHistory: (swapHistory || []).map(fromSwapOperationRaw),
    approvals,
    balanceHistoryCache: balanceHistoryCache || emptyHistoryCache,
  };
  res.balanceHistoryCache = generateHistoryFromOperations(res as TokenAccount);
  return res as TokenAccount;
}
export function toTokenAccountRaw(ta: TokenAccount): TokenAccountRaw {
  const {
    id,
    parentId,
    token,
    starred,
    operations,
    operationsCount,
    pendingOperations,
    balance,
    spendableBalance,
    compoundBalance,
    balanceHistory,
    balanceHistoryCache,
    swapHistory,
    approvals,
  } = ta;
  return {
    type: "TokenAccountRaw",
    id,
    parentId,
    starred,
    tokenId: token.id,
    balance: balance.toString(),
    spendableBalance: spendableBalance.toString(),
    compoundBalance: compoundBalance ? compoundBalance.toString() : undefined,
    balanceHistory: balanceHistory
      ? toBalanceHistoryRawMap(balanceHistory)
      : undefined,
    balanceHistoryCache,
    creationDate: ta.creationDate.toISOString(),
    operationsCount,
    operations: operations.map((o) => toOperationRaw(o)),
    pendingOperations: pendingOperations.map((o) => toOperationRaw(o)),
    swapHistory: (swapHistory || []).map(toSwapOperationRaw),
    approvals,
  };
}
export function fromChildAccountRaw(raw: ChildAccountRaw): ChildAccount {
  const {
    id,
    name,
    parentId,
    currencyId,
    starred,
    creationDate,
    operations,
    operationsCount,
    pendingOperations,
    balance,
    address,
    balanceHistory,
    balanceHistoryCache,
    swapHistory,
  } = raw;
  const currency = getCryptoCurrencyById(currencyId);

  const convertOperation = (op) => fromOperationRaw(op, id);

  const res: ChildAccount = {
    type: "ChildAccount",
    id,
    name,
    starred: starred || false,
    parentId,
    currency,
    address,
    balance: new BigNumber(balance),
    balanceHistory: balanceHistory
      ? fromBalanceHistoryRawMap(balanceHistory)
      : undefined,
    creationDate: new Date(creationDate || Date.now()),
    operationsCount: operationsCount || (operations && operations.length) || 0,
    operations: (operations || []).map(convertOperation),
    pendingOperations: (pendingOperations || []).map(convertOperation),
    swapHistory: (swapHistory || []).map(fromSwapOperationRaw),
    balanceHistoryCache: balanceHistoryCache || emptyHistoryCache,
  };
  res.balanceHistoryCache = generateHistoryFromOperations(res);
  return res;
}
export function toChildAccountRaw(ca: ChildAccount): ChildAccountRaw {
  const {
    id,
    name,
    parentId,
    starred,
    currency,
    operations,
    operationsCount,
    pendingOperations,
    balance,
    balanceHistory,
    balanceHistoryCache,
    address,
    creationDate,
    swapHistory,
  } = ca;
  return {
    type: "ChildAccountRaw",
    id,
    name,
    starred,
    parentId,
    address,
    operationsCount,
    currencyId: currency.id,
    balance: balance.toString(),
    balanceHistory: balanceHistory
      ? toBalanceHistoryRawMap(balanceHistory)
      : undefined,
    balanceHistoryCache,
    creationDate: creationDate.toISOString(),
    operations: operations.map((o) => toOperationRaw(o)),
    pendingOperations: pendingOperations.map((o) => toOperationRaw(o)),
    swapHistory: (swapHistory || []).map(toSwapOperationRaw),
  };
}
export function fromSubAccountRaw(raw: SubAccountRaw): SubAccount {
  switch (raw.type) {
    case "ChildAccountRaw":
      return fromChildAccountRaw(raw);

    case "TokenAccountRaw":
      return fromTokenAccountRaw(raw);

    default:
      throw new Error("invalid raw.type=" + (raw as SubAccountRaw).type);
  }
}
export function toSubAccountRaw(subAccount: SubAccount): SubAccountRaw {
  switch (subAccount.type) {
    case "ChildAccount":
      return toChildAccountRaw(subAccount);

    case "TokenAccount":
      return toTokenAccountRaw(subAccount);

    default:
      throw new Error(
        "invalid subAccount.type=" + (subAccount as SubAccount).type
      );
  }
}
export function fromAccountLikeRaw(
  rawAccountLike: AccountRawLike
): AccountLike {
  if ("type" in rawAccountLike) {
    //$FlowFixMe
    return fromSubAccountRaw(rawAccountLike);
  }

  //$FlowFixMe
  return fromAccountRaw(rawAccountLike);
}
export function toAccountLikeRaw(accountLike: AccountLike): AccountRawLike {
  switch (accountLike.type) {
    case "Account":
      return toAccountRaw(accountLike);

    default:
      return toSubAccountRaw(accountLike);
  }
}
export function fromAccountRaw(rawAccount: AccountRaw): Account {
  const {
    id,
    seedIdentifier,
    derivationMode,
    index,
    xpub,
    starred,
    used,
    freshAddress,
    freshAddressPath,
    freshAddresses,
    name,
    blockHeight,
    endpointConfig,
    currencyId,
    unitMagnitude,
    operations,
    operationsCount,
    pendingOperations,
    lastSyncDate,
    creationDate,
    balance,
    balanceHistory,
    balanceHistoryCache,
    spendableBalance,
    subAccounts: subAccountsRaw,
    tronResources,
    cosmosResources,
    tezosResources,
    bitcoinResources,
    swapHistory,
    algorandResources,
    syncHash,
    polkadotResources,
    elrondResources,
    cryptoOrgResources,
    cardanoResources,
    solanaResources,
    nfts,
  } = rawAccount;
  const subAccounts =
    subAccountsRaw &&
    subAccountsRaw
      .map((ta) => {
        if (ta.type === "TokenAccountRaw") {
          if (findTokenById(ta.tokenId)) {
            return fromTokenAccountRaw(ta);
          }
        } else {
          return fromSubAccountRaw(ta);
        }
      })
      .filter(Boolean);
  const currency = getCryptoCurrencyById(currencyId);
  const unit =
    currency.units.find((u) => u.magnitude === unitMagnitude) ||
    currency.units[0];

  const convertOperation = (op) =>
    fromOperationRaw(op, id, subAccounts as SubAccount[]);

  const res: Account = {
    type: "Account",
    id,
    starred: starred || false,
    used: false,
    // filled again below
    seedIdentifier,
    derivationMode,
    index,
    freshAddress,
    freshAddressPath,
    freshAddresses: freshAddresses || [
      // in case user come from an old data that didn't support freshAddresses
      {
        derivationPath: freshAddressPath,
        address: freshAddress,
      },
    ],
    name,
    blockHeight,
    creationDate: new Date(creationDate || Date.now()),
    balance: new BigNumber(balance),
    balanceHistory: balanceHistory
      ? fromBalanceHistoryRawMap(balanceHistory)
      : undefined,
    spendableBalance: new BigNumber(spendableBalance || balance),
    operations: (operations || []).map(convertOperation),
    operationsCount: operationsCount || (operations && operations.length) || 0,
    pendingOperations: (pendingOperations || []).map(convertOperation),
    unit,
    currency,
    lastSyncDate: new Date(lastSyncDate || 0),
    swapHistory: [],
    syncHash,
    balanceHistoryCache: balanceHistoryCache || emptyHistoryCache,
    nfts: nfts?.map((n) => fromNFTRaw(n)),
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

  if (endpointConfig) {
    res.endpointConfig = endpointConfig;
  }

  if (subAccounts) {
    res.subAccounts = subAccounts as SubAccount[];
  }

  if (tronResources) {
    res.tronResources = fromTronResourcesRaw(tronResources);
  }

  if (cosmosResources) {
    res.cosmosResources = fromCosmosResourcesRaw(cosmosResources);
  }

  if (tezosResources) {
    res.tezosResources = fromTezosResourcesRaw(tezosResources);
  }

  if (bitcoinResources) {
    res.bitcoinResources = fromBitcoinResourcesRaw(bitcoinResources);
  }

  if (swapHistory) {
    res.swapHistory = swapHistory.map(fromSwapOperationRaw);
  }

  if (algorandResources) {
    res.algorandResources = fromAlgorandResourcesRaw(algorandResources);
  }

  if (polkadotResources) {
    res.polkadotResources = fromPolkadotResourcesRaw(polkadotResources);
  }

  if (elrondResources) {
    res.elrondResources = fromElrondResourcesRaw(elrondResources);
  }

  if (elrondResources) {
    res.elrondResources = fromElrondResourcesRaw(elrondResources);
  }

  if (cryptoOrgResources) {
    res.cryptoOrgResources = fromCryptoOrgResourcesRaw(cryptoOrgResources);
  }

  if (cardanoResources) {
    res.cardanoResources = fromCardanoResourceRaw(cardanoResources);
  }

  if (solanaResources) {
    res.solanaResources = fromSolanaResourcesRaw(solanaResources);
  }

  return res;
}
export function toAccountRaw({
  id,
  seedIdentifier,
  xpub,
  name,
  starred,
  used,
  derivationMode,
  index,
  freshAddress,
  freshAddressPath,
  freshAddresses,
  blockHeight,
  currency,
  creationDate,
  operationsCount,
  operations,
  pendingOperations,
  unit,
  lastSyncDate,
  balance,
  balanceHistory,
  balanceHistoryCache,
  spendableBalance,
  subAccounts,
  endpointConfig,
  tronResources,
  cosmosResources,
  bitcoinResources,
  tezosResources,
  swapHistory,
  algorandResources,
  syncHash,
  polkadotResources,
  elrondResources,
  cryptoOrgResources,
  solanaResources,
  nfts,
  cardanoResources,
}: Account): AccountRaw {
  const res: AccountRaw = {
    id,
    seedIdentifier,
    name,
    starred,
    used,
    derivationMode,
    index,
    freshAddress,
    freshAddressPath,
    freshAddresses,
    blockHeight,
    syncHash,
    creationDate: creationDate.toISOString(),
    operationsCount,
    operations: (operations || []).map((o) => toOperationRaw(o)),
    pendingOperations: (pendingOperations || []).map((o) => toOperationRaw(o)),
    currencyId: currency.id,
    unitMagnitude: unit.magnitude,
    lastSyncDate: lastSyncDate.toISOString(),
    balance: balance.toFixed(),
    spendableBalance: spendableBalance.toFixed(),
    nfts: nfts?.map((n) => toNFTRaw(n)),
  };

  if (balanceHistory) {
    res.balanceHistory = toBalanceHistoryRawMap(balanceHistory);
  }

  if (balanceHistoryCache) {
    res.balanceHistoryCache = balanceHistoryCache;
  }

  if (endpointConfig) {
    res.endpointConfig = endpointConfig;
  }

  if (xpub) {
    res.xpub = xpub;
  }

  if (subAccounts) {
    res.subAccounts = subAccounts.map(toSubAccountRaw);
  }

  if (tronResources) {
    res.tronResources = toTronResourcesRaw(tronResources);
  }

  if (cosmosResources) {
    res.cosmosResources = toCosmosResourcesRaw(cosmosResources);
  }

  if (tezosResources) {
    res.tezosResources = toTezosResourcesRaw(tezosResources);
  }

  if (bitcoinResources) {
    res.bitcoinResources = toBitcoinResourcesRaw(bitcoinResources);
  }

  if (swapHistory) {
    res.swapHistory = swapHistory.map(toSwapOperationRaw);
  }

  if (algorandResources) {
    res.algorandResources = toAlgorandResourcesRaw(algorandResources);
  }

  if (polkadotResources) {
    res.polkadotResources = toPolkadotResourcesRaw(polkadotResources);
  }
  if (elrondResources) {
    res.elrondResources = toElrondResourcesRaw(elrondResources);
  }
  if (cryptoOrgResources) {
    res.cryptoOrgResources = toCryptoOrgResourcesRaw(cryptoOrgResources);
  }
  if (cardanoResources) {
    res.cardanoResources = toCardanoResourceRaw(cardanoResources);
  }

  if (solanaResources) {
    res.solanaResources = toSolanaResourcesRaw(solanaResources);
  }

  return res;
}

export function toNFTRaw({
  id,
  tokenId,
  amount,
  contract,
  standard,
  currencyId,
  metadata,
}: ProtoNFT): ProtoNFTRaw {
  return {
    id,
    tokenId,
    amount: amount.toFixed(),
    contract,
    standard,
    currencyId,
    metadata,
  };
}

export function fromNFTRaw({
  id,
  tokenId,
  amount,
  contract,
  standard,
  currencyId,
  metadata,
}: ProtoNFTRaw): ProtoNFT {
  return {
    id,
    tokenId,
    amount: new BigNumber(amount),
    contract,
    standard,
    currencyId,
    metadata,
  };
}
