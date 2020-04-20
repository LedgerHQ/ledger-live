// @flow
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
  SubAccountRaw
} from "../types";
import type { TronResources, TronResourcesRaw } from "../families/tron/types";
import {
  toCosmosResourcesRaw,
  fromCosmosResourcesRaw
} from "../families/cosmos/serialization";
import {
  getCryptoCurrencyById,
  getTokenById,
  findTokenById
} from "../currencies";

export { toCosmosResourcesRaw, fromCosmosResourcesRaw };

export function toBalanceHistoryRaw(b: BalanceHistory): BalanceHistoryRaw {
  return b.map(({ date, value }) => [date.toISOString(), value.toString()]);
}

export function fromBalanceHistoryRaw(b: BalanceHistoryRaw): BalanceHistory {
  return b.map(([date, value]) => ({
    date: new Date(date),
    value: new BigNumber(value)
  }));
}

export function toBalanceHistoryRawMap(
  bhm: BalanceHistoryMap
): BalanceHistoryRawMap {
  const map = {};
  Object.keys(bhm).forEach(range => {
    map[range] = toBalanceHistoryRaw(bhm[range]);
  });
  return map;
}

export function fromBalanceHistoryRawMap(
  bhm: BalanceHistoryRawMap
): BalanceHistoryMap {
  const map = {};
  Object.keys(bhm).forEach(range => {
    map[range] = fromBalanceHistoryRaw(bhm[range]);
  });
  return map;
}

export const toOperationRaw = (
  { date, value, fee, subOperations, internalOperations, ...op }: Operation,
  preserveSubOperation?: boolean
): OperationRaw => {
  const copy: OperationRaw = {
    ...op,
    date: date.toISOString(),
    value: value.toString(),
    fee: fee.toString()
  };
  if (subOperations && preserveSubOperation) {
    copy.subOperations = subOperations.map(o => toOperationRaw(o));
  }
  if (internalOperations) {
    copy.internalOperations = internalOperations.map(o => toOperationRaw(o));
  }
  return copy;
};

export const inferSubOperations = (
  txHash: string,
  subAccounts: SubAccount[]
): Operation[] => {
  const all = [];
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
    ...op
  }: OperationRaw,
  accountId: string,
  subAccounts?: ?(SubAccount[])
): Operation => {
  const res: Operation = {
    ...op,
    accountId,
    date: new Date(date),
    value: BigNumber(value),
    fee: BigNumber(fee),
    extra: extra || {}
  };

  if (subAccounts) {
    res.subOperations = inferSubOperations(op.hash, subAccounts);
  } else if (subOperations) {
    res.subOperations = subOperations.map(o =>
      fromOperationRaw(o, o.accountId)
    );
  }

  if (internalOperations) {
    res.internalOperations = internalOperations.map(o =>
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
  cacheTransactionInfoById: cacheTx
}: TronResources): TronResourcesRaw => {
  const frozenBandwidth = frozen.bandwidth;
  const frozenEnergy = frozen.energy;
  const delegatedFrozenBandwidth = delegatedFrozen.bandwidth;
  const delegatedFrozenEnergy = delegatedFrozen.energy;
  const cacheTransactionInfoById = {};
  for (let k in cacheTx) {
    const { fee, blockNumber, withdraw_amount, unfreeze_amount } = cacheTx[k];
    cacheTransactionInfoById[k] = [
      fee,
      blockNumber,
      withdraw_amount,
      unfreeze_amount
    ];
  }

  return {
    frozen: {
      bandwidth: frozenBandwidth
        ? {
            amount: frozenBandwidth.amount.toString(),
            expiredAt: frozenBandwidth.expiredAt.toISOString()
          }
        : undefined,
      energy: frozenEnergy
        ? {
            amount: frozenEnergy.amount.toString(),
            expiredAt: frozenEnergy.expiredAt.toISOString()
          }
        : undefined
    },
    delegatedFrozen: {
      bandwidth: delegatedFrozenBandwidth
        ? { amount: delegatedFrozenBandwidth.amount.toString() }
        : undefined,
      energy: delegatedFrozenEnergy
        ? { amount: delegatedFrozenEnergy.amount.toString() }
        : undefined
    },
    votes,
    tronPower,
    energy: energy.toString(),
    bandwidth: {
      freeUsed: bandwidth.freeUsed.toString(),
      freeLimit: bandwidth.freeLimit.toString(),
      gainedUsed: bandwidth.gainedUsed.toString(),
      gainedLimit: bandwidth.gainedLimit.toString()
    },
    unwithdrawnReward: unwithdrawnReward.toString(),
    lastWithdrawnRewardDate: lastWithdrawnRewardDate
      ? lastWithdrawnRewardDate.toISOString()
      : undefined,
    lastVotedDate: lastVotedDate ? lastVotedDate.toISOString() : undefined,
    cacheTransactionInfoById
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
  cacheTransactionInfoById: cacheTransactionInfoByIdRaw
}: TronResourcesRaw): TronResources => {
  const frozenBandwidth = frozen.bandwidth;
  const frozenEnergy = frozen.energy;
  const delegatedFrozenBandwidth = delegatedFrozen.bandwidth;
  const delegatedFrozenEnergy = delegatedFrozen.energy;
  const cacheTransactionInfoById = {};
  if (cacheTransactionInfoByIdRaw) {
    for (let k in cacheTransactionInfoByIdRaw) {
      const [
        fee,
        blockNumber,
        withdraw_amount,
        unfreeze_amount
      ] = cacheTransactionInfoByIdRaw[k];
      cacheTransactionInfoById[k] = {
        fee,
        blockNumber,
        withdraw_amount,
        unfreeze_amount
      };
    }
  }
  return {
    frozen: {
      bandwidth: frozenBandwidth
        ? {
            amount: BigNumber(frozenBandwidth.amount),
            expiredAt: new Date(frozenBandwidth.expiredAt)
          }
        : undefined,
      energy: frozenEnergy
        ? {
            amount: BigNumber(frozenEnergy.amount),
            expiredAt: new Date(frozenEnergy.expiredAt)
          }
        : undefined
    },
    delegatedFrozen: {
      bandwidth: delegatedFrozenBandwidth
        ? { amount: BigNumber(delegatedFrozenBandwidth.amount) }
        : undefined,
      energy: delegatedFrozenEnergy
        ? { amount: BigNumber(delegatedFrozenEnergy.amount) }
        : undefined
    },
    votes,
    tronPower,
    energy: BigNumber(energy),
    bandwidth: {
      freeUsed: BigNumber(bandwidth.freeUsed),
      freeLimit: BigNumber(bandwidth.freeLimit),
      gainedUsed: BigNumber(bandwidth.gainedUsed),
      gainedLimit: BigNumber(bandwidth.gainedLimit)
    },
    unwithdrawnReward: BigNumber(unwithdrawnReward),
    lastWithdrawnRewardDate: lastWithdrawnRewardDate
      ? new Date(lastWithdrawnRewardDate)
      : undefined,
    lastVotedDate: lastVotedDate ? new Date(lastVotedDate) : undefined,
    cacheTransactionInfoById
  };
};

export function fromTokenAccountRaw(raw: TokenAccountRaw): TokenAccount {
  const {
    id,
    parentId,
    tokenId,
    starred,
    operations,
    pendingOperations,
    balance,
    balanceHistory
  } = raw;
  const token = getTokenById(tokenId);
  const convertOperation = op => fromOperationRaw(op, id);
  return {
    type: "TokenAccount",
    id,
    parentId,
    token,
    starred: starred || false,
    balance: BigNumber(balance),
    balanceHistory: fromBalanceHistoryRawMap(balanceHistory || {}),
    operationsCount:
      raw.operationsCount || (operations && operations.length) || 0,
    operations: (operations || []).map(convertOperation),
    pendingOperations: (pendingOperations || []).map(convertOperation)
  };
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
    balanceHistory
  } = ta;
  return {
    type: "TokenAccountRaw",
    id,
    parentId,
    starred,
    tokenId: token.id,
    balance: balance.toString(),
    balanceHistory: toBalanceHistoryRawMap(balanceHistory || {}),
    operationsCount,
    operations: operations.map(o => toOperationRaw(o)),
    pendingOperations: pendingOperations.map(o => toOperationRaw(o))
  };
}

export function fromChildAccountRaw(raw: ChildAccountRaw): ChildAccount {
  const {
    id,
    name,
    parentId,
    currencyId,
    starred,
    operations,
    operationsCount,
    pendingOperations,
    balance,
    address,
    balanceHistory
  } = raw;
  const currency = getCryptoCurrencyById(currencyId);
  const convertOperation = op => fromOperationRaw(op, id);
  return {
    type: "ChildAccount",
    id,
    name,
    starred: starred || false,
    parentId,
    currency,
    address,
    balance: BigNumber(balance),
    balanceHistory: fromBalanceHistoryRawMap(balanceHistory || {}),
    operationsCount: operationsCount || (operations && operations.length) || 0,
    operations: (operations || []).map(convertOperation),
    pendingOperations: (pendingOperations || []).map(convertOperation)
  };
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
    address
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
    balanceHistory: toBalanceHistoryRawMap(balanceHistory || {}),
    operations: operations.map(o => toOperationRaw(o)),
    pendingOperations: pendingOperations.map(o => toOperationRaw(o))
  };
}

export function fromSubAccountRaw(raw: SubAccountRaw): SubAccount {
  switch (raw.type) {
    case "ChildAccountRaw":
      return fromChildAccountRaw(raw);
    case "TokenAccountRaw":
      return fromTokenAccountRaw(raw);
    default:
      throw new Error("invalid raw.type=" + raw.type);
  }
}

export function toSubAccountRaw(subAccount: SubAccount): SubAccountRaw {
  switch (subAccount.type) {
    case "ChildAccount":
      return toChildAccountRaw(subAccount);
    case "TokenAccount":
      return toTokenAccountRaw(subAccount);
    default:
      throw new Error("invalid subAccount.type=" + subAccount.type);
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
    balance,
    balanceHistory,
    spendableBalance,
    subAccounts: subAccountsRaw,
    tronResources,
    cosmosResources
  } = rawAccount;

  const subAccounts =
    subAccountsRaw &&
    subAccountsRaw
      .map(ta => {
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
    currency.units.find(u => u.magnitude === unitMagnitude) ||
    currency.units[0];

  const convertOperation = op => fromOperationRaw(op, id, subAccounts);

  const res: $Exact<Account> = {
    type: "Account",
    id,
    starred: starred || false,
    seedIdentifier,
    derivationMode,
    index,
    freshAddress,
    freshAddressPath,
    freshAddresses: freshAddresses || [
      // in case user come from an old data that didn't support freshAddresses
      { derivationPath: freshAddressPath, address: freshAddress }
    ],
    name,
    blockHeight,
    balance: BigNumber(balance),
    balanceHistory: fromBalanceHistoryRawMap(balanceHistory || {}),
    spendableBalance: BigNumber(spendableBalance || balance),
    operations: (operations || []).map(convertOperation),
    operationsCount: operationsCount || (operations && operations.length) || 0,
    pendingOperations: (pendingOperations || []).map(convertOperation),
    unit,
    currency,
    lastSyncDate: new Date(lastSyncDate || 0)
  };

  if (xpub) {
    res.xpub = xpub;
  }

  if (endpointConfig) {
    res.endpointConfig = endpointConfig;
  }

  if (subAccounts) {
    res.subAccounts = subAccounts;
  }

  if (tronResources) {
    res.tronResources = fromTronResourcesRaw(tronResources);
  }

  if (cosmosResources) {
    res.cosmosResources = fromCosmosResourcesRaw(cosmosResources);
  }

  return res;
}

export function toAccountRaw({
  id,
  seedIdentifier,
  xpub,
  name,
  starred,
  derivationMode,
  index,
  freshAddress,
  freshAddressPath,
  freshAddresses,
  blockHeight,
  currency,
  operationsCount,
  operations,
  pendingOperations,
  unit,
  lastSyncDate,
  balance,
  balanceHistory,
  spendableBalance,
  subAccounts,
  endpointConfig,
  tronResources,
  cosmosResources
}: Account): AccountRaw {
  const res: $Exact<AccountRaw> = {
    id,
    seedIdentifier,
    name,
    starred,
    derivationMode,
    index,
    freshAddress,
    freshAddressPath,
    freshAddresses,
    blockHeight,
    operationsCount,
    operations: (operations || []).map(o => toOperationRaw(o)),
    pendingOperations: (pendingOperations || []).map(o => toOperationRaw(o)),
    currencyId: currency.id,
    unitMagnitude: unit.magnitude,
    lastSyncDate: lastSyncDate.toISOString(),
    balance: balance.toString(),
    spendableBalance: spendableBalance.toString()
  };
  if (balanceHistory) {
    res.balanceHistory = toBalanceHistoryRawMap(balanceHistory);
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
  return res;
}
