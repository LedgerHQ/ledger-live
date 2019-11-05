// @flow
import { BigNumber } from "bignumber.js";
import type {
  Account,
  AccountRaw,
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

export const toOperationRaw = (
  { date, value, fee, subOperations, internalOperations, ...op }: Operation,
  preserveSubOperation?: boolean
): OperationRaw => {
  const copy: $Exact<OperationRaw> = {
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
  const res: $Exact<Operation> = {
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
  const { id, parentId, tokenId, operations, pendingOperations, balance } = raw;
  const token = getTokenById(tokenId);
  const convertOperation = op => fromOperationRaw(op, id);
  return {
    type: "TokenAccount",
    id,
    parentId,
    token,
    balance: BigNumber(balance),
    operations: (operations || []).map(convertOperation),
    pendingOperations: (pendingOperations || []).map(convertOperation)
  };
}

export function toTokenAccountRaw(raw: TokenAccount): TokenAccountRaw {
  const { id, parentId, token, operations, pendingOperations, balance } = raw;
  return {
    type: "TokenAccountRaw",
    id,
    parentId,
    tokenId: token.id,
    balance: balance.toString(),
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
    pendingOperations,
    balance,
    address,
    capabilities
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
    operations: (operations || []).map(convertOperation),
    pendingOperations: (pendingOperations || []).map(convertOperation)
  };
}

export function toChildAccountRaw(raw: ChildAccount): ChildAccountRaw {
  const {
    id,
    name,
    parentId,
    currency,
    operations,
    pendingOperations,
    balance,
    address,
    capabilities
  } = raw;
  return {
    type: "ChildAccountRaw",
    id,
    name,
    parentId,
    address,
    capabilities,
    currencyId: currency.id,
    balance: balance.toString(),
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
    pendingOperations,
    lastSyncDate,
    balance,
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
    spendableBalance: BigNumber(spendableBalance || balance),
    operations: (operations || []).map(convertOperation),
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
  operations,
  pendingOperations,
  unit,
  lastSyncDate,
  balance,
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
    operations: (operations || []).map(o => toOperationRaw(o)),
    pendingOperations: (pendingOperations || []).map(o => toOperationRaw(o)),
    currencyId: currency.id,
    unitMagnitude: unit.magnitude,
    lastSyncDate: lastSyncDate.toISOString(),
    balance: balance.toString(),
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
