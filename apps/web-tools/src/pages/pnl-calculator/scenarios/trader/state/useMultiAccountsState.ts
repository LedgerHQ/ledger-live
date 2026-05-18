import { useMemo, useState } from "react";
import { makeInitialAccount } from "../model/factories";
import type { TraderAccountState, TraderAssetId, TraderOpInput } from "../model/types";
import {
  withAssetId,
  withCurrentPrice,
  withRowAppended,
  withRowRemoved,
  withRowUpdated,
} from "./accountUpdaters";

export type MultiAccountsActions = {
  add: (assetId: TraderAssetId) => void;
  remove: (accountId: string) => void;
  setAssetId: (accountId: string, id: TraderAssetId) => void;
  setCurrentPrice: (accountId: string, value: string) => void;
  addRow: (accountId: string, values?: TraderOpInput) => void;
  setRow: (accountId: string, rowId: string, values: TraderOpInput) => void;
  removeRow: (accountId: string, rowId: string) => void;
};

export type UseMultiAccountsState = {
  accounts: TraderAccountState[];
  canRemove: boolean;
  actions: MultiAccountsActions;
};

type AccountsSnapshot = TraderAccountState[];

function updateOne(
  accounts: AccountsSnapshot,
  accountId: string,
  update: (prev: TraderAccountState) => TraderAccountState,
): AccountsSnapshot {
  return accounts.map(a => (a.id === accountId ? update(a) : a));
}

function addAccountReducer(assetId: TraderAssetId): (prev: AccountsSnapshot) => AccountsSnapshot {
  return prev => [...prev, makeInitialAccount(assetId)];
}

function removeAccountReducer(accountId: string): (prev: AccountsSnapshot) => AccountsSnapshot {
  return prev => (prev.length <= 1 ? prev : prev.filter(a => a.id !== accountId));
}

function patchAccountReducer(
  accountId: string,
  patch: (acc: TraderAccountState) => TraderAccountState,
): (prev: AccountsSnapshot) => AccountsSnapshot {
  return prev => updateOne(prev, accountId, patch);
}

function patchAssetId(id: TraderAssetId): (acc: TraderAccountState) => TraderAccountState {
  return acc => withAssetId(acc, id);
}

function patchCurrentPrice(value: string): (acc: TraderAccountState) => TraderAccountState {
  return acc => withCurrentPrice(acc, value);
}

function patchRowAppended(values?: TraderOpInput): (acc: TraderAccountState) => TraderAccountState {
  return acc => withRowAppended(acc, values);
}

function patchRowUpdated(
  rowId: string,
  values: TraderOpInput,
): (acc: TraderAccountState) => TraderAccountState {
  return acc => withRowUpdated(acc, rowId, values);
}

function patchRowRemoved(rowId: string): (acc: TraderAccountState) => TraderAccountState {
  return acc => withRowRemoved(acc, rowId);
}

export function useMultiAccountsState(
  initialAssetIds: readonly TraderAssetId[],
): UseMultiAccountsState {
  const [accounts, setAccounts] = useState<TraderAccountState[]>(() =>
    initialAssetIds.map(makeInitialAccount),
  );

  const actions = useMemo<MultiAccountsActions>(
    () => ({
      add: assetId => setAccounts(addAccountReducer(assetId)),
      remove: accountId => setAccounts(removeAccountReducer(accountId)),
      setAssetId: (accountId, id) => setAccounts(patchAccountReducer(accountId, patchAssetId(id))),
      setCurrentPrice: (accountId, value) =>
        setAccounts(patchAccountReducer(accountId, patchCurrentPrice(value))),
      addRow: (accountId, values) =>
        setAccounts(patchAccountReducer(accountId, patchRowAppended(values))),
      setRow: (accountId, rowId, values) =>
        setAccounts(patchAccountReducer(accountId, patchRowUpdated(rowId, values))),
      removeRow: (accountId, rowId) =>
        setAccounts(patchAccountReducer(accountId, patchRowRemoved(rowId))),
    }),
    [],
  );

  return { accounts, canRemove: accounts.length > 1, actions };
}
