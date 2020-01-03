// @flow
import { BigNumber } from "bignumber.js";
import type {
  Account,
  AccountRaw,
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
import {
  getCryptoCurrencyById,
  getTokenById,
  findTokenById
} from "../currencies";

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

export function fromTokenAccountRaw(raw: TokenAccountRaw): TokenAccount {
  const {
    id,
    parentId,
    tokenId,
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
    operations,
    operationsCount,
    pendingOperations,
    balance,
    address,
    capabilities,
    balanceHistory
  } = raw;
  const currency = getCryptoCurrencyById(currencyId);
  const convertOperation = op => fromOperationRaw(op, id);
  return {
    type: "ChildAccount",
    id,
    name,
    parentId,
    currency,
    address,
    capabilities,
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
    currency,
    operations,
    operationsCount,
    pendingOperations,
    balance,
    balanceHistory,
    address,
    capabilities
  } = ca;
  return {
    type: "ChildAccountRaw",
    id,
    name,
    parentId,
    address,
    capabilities,
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

export function fromAccountRaw(rawAccount: AccountRaw): Account {
  const {
    id,
    seedIdentifier,
    derivationMode,
    index,
    xpub,
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
    subAccounts: subAccountsRaw
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

  return res;
}

export function toAccountRaw({
  id,
  seedIdentifier,
  xpub,
  name,
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
  endpointConfig
}: Account): AccountRaw {
  const res: $Exact<AccountRaw> = {
    id,
    seedIdentifier,
    name,
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
    balanceHistory: toBalanceHistoryRawMap(balanceHistory || {}),
    spendableBalance: spendableBalance.toString()
  };
  if (endpointConfig) {
    res.endpointConfig = endpointConfig;
  }
  if (xpub) {
    res.xpub = xpub;
  }
  if (subAccounts) {
    res.subAccounts = subAccounts.map(toSubAccountRaw);
  }
  return res;
}
