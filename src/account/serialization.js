// @flow
import { BigNumber } from "bignumber.js";
import type {
  Account,
  AccountRaw,
  TokenAccount,
  TokenAccountRaw,
  Operation,
  OperationRaw
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
  tokenAccounts: TokenAccount[]
): Operation[] => {
  const all = [];
  for (let i = 0; i < tokenAccounts.length; i++) {
    const ta = tokenAccounts[i];
    for (let j = 0; j < ta.operations.length; j++) {
      const op = ta.operations[j];
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
  tokenAccounts?: ?(TokenAccount[])
): Operation => {
  const res: $Exact<Operation> = {
    ...op,
    accountId,
    date: new Date(date),
    value: BigNumber(value),
    fee: BigNumber(fee),
    extra: extra || {}
  };

  if (tokenAccounts) {
    res.subOperations = inferSubOperations(op.hash, tokenAccounts);
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
    id,
    parentId,
    tokenId: token.id,
    balance: balance.toString(),
    operations: operations.map(o => toOperationRaw(o)),
    pendingOperations: pendingOperations.map(o => toOperationRaw(o))
  };
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
    name,
    blockHeight,
    endpointConfig,
    currencyId,
    unitMagnitude,
    operations,
    pendingOperations,
    lastSyncDate,
    balance,
    tokenAccounts: tokenAccountsRaw
  } = rawAccount;

  const tokenAccounts =
    tokenAccountsRaw &&
    tokenAccountsRaw
      .map(ta => {
        if (findTokenById(ta.tokenId)) {
          return fromTokenAccountRaw(ta);
        }
      })
      .filter(Boolean);

  const currency = getCryptoCurrencyById(currencyId);

  const unit =
    currency.units.find(u => u.magnitude === unitMagnitude) ||
    currency.units[0];

  const convertOperation = op => fromOperationRaw(op, id, tokenAccounts);

  const res: $Exact<Account> = {
    type: "Account",
    id,
    seedIdentifier,
    derivationMode,
    index,
    freshAddress,
    freshAddressPath,
    name,
    blockHeight,
    balance: BigNumber(balance),
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

  if (tokenAccounts) {
    res.tokenAccounts = tokenAccounts;
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
  blockHeight,
  currency,
  operations,
  pendingOperations,
  unit,
  lastSyncDate,
  balance,
  tokenAccounts,
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
    blockHeight,
    operations: operations.map(o => toOperationRaw(o)),
    pendingOperations: pendingOperations.map(o => toOperationRaw(o)),
    currencyId: currency.id,
    unitMagnitude: unit.magnitude,
    lastSyncDate: lastSyncDate.toISOString(),
    balance: balance.toString()
  };
  if (endpointConfig) {
    res.endpointConfig = endpointConfig;
  }
  if (xpub) {
    res.xpub = xpub;
  }
  if (tokenAccounts) {
    res.tokenAccounts = tokenAccounts.map(toTokenAccountRaw);
  }
  return res;
}
