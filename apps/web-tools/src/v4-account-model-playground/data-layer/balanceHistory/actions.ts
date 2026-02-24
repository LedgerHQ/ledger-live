/**
 * BalanceHistory domain – thunk orchestrates load (account + ops if needed); slice reducers apply.
 */
import { createAsyncThunk } from "@reduxjs/toolkit";
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { AppDispatch, RootState } from "../../store";
import { isAlpacaForAccountId } from "../../shared/syncStrategy";
import {
  syncAccountViaBridge,
  splitAccountIntoSliceUpdates,
  deriveBalanceHistoryFromOperations,
} from "../../shared/compatibility";
import { setBalanceHistoryForAccount } from "./slice";
import { loadOperationHistory } from "../operationHistory/actions";
import { loadAccountData } from "../../shared/accountDataActions";

function getParentAccountId(state: RootState, accountId: string): string | null {
  if (state.accounts.byId[accountId]) return null;
  for (const main of Object.values(state.accounts.byId)) {
    if (main.subAccounts?.some(s => s.id === accountId)) return main.id;
  }
  return null;
}

function getBalanceForAccountId(state: RootState, accountId: string): BigNumber | null {
  const acc = state.accounts.byId[accountId];
  if (acc) return new BigNumber(acc.balance);
  for (const main of Object.values(state.accounts.byId)) {
    const sub = main.subAccounts?.find(s => s.id === accountId);
    if (sub) return new BigNumber(sub.balance);
  }
  return null;
}

function hasOpsInContext(state: RootState, accountId: string): boolean {
  return accountId in state.operationHistory.byAccountId;
}

export const loadBalanceHistory = createAsyncThunk(
  "balanceHistory/load",
  async (accountId: string, { getState, dispatch }) => {
    const state = getState() as RootState;
    const parentId = getParentAccountId(state, accountId);
    const mainId = parentId ?? accountId;
    const isAlpaca = isAlpacaForAccountId(mainId);

    const balance = getBalanceForAccountId(state, accountId);
    const hasOps = hasOpsInContext(state, accountId);

    if (balance != null && hasOps) {
      await applyDeriveAndDispatch(accountId, getState as () => RootState, dispatch);
      return;
    }

    if (parentId != null) {
      if (balance == null) await dispatch(loadAccountData(parentId)).unwrap();
      if (!hasOps) await dispatch(loadOperationHistory({ accountId: parentId }));
      await applyDeriveAndDispatch(accountId, getState as () => RootState, dispatch);
      return;
    }

    if (isAlpaca) {
      if (balance == null) await dispatch(loadAccountData(mainId)).unwrap();
      if (!hasOps) await dispatch(loadOperationHistory({ accountId: mainId }));
      await applyDeriveAndDispatch(accountId, getState as () => RootState, dispatch);
      return;
    }

    const account = await syncAccountViaBridge(accountId);
    const updates = splitAccountIntoSliceUpdates(account);
    dispatch(
      setBalanceHistoryForAccount({
        accountId: account.id,
        history: updates.balanceHistory,
      }),
    );
  },
);

async function applyDeriveAndDispatch(
  accountId: string,
  getState: () => RootState,
  dispatch: AppDispatch,
): Promise<void> {
  const state = getState();
  const balance = getBalanceForAccountId(state, accountId);
  const entry = state.operationHistory.byAccountId[accountId];
  const pending = state.transactional.pendingOperationsByAccountId[accountId] ?? [];
  if (balance == null || !entry) return;
  const storedOps = [...pending, ...entry.operations];
  const ops = storedOps.map(op => ({
    ...op,
    value: new BigNumber(op.value),
    fee: new BigNumber(op.fee),
    date: new Date(op.date),
    transactionSequenceNumber: op.transactionSequenceNumber
      ? new BigNumber(op.transactionSequenceNumber)
      : undefined,
  })) as Account["operations"];
  const history = deriveBalanceHistoryFromOperations(balance, ops, accountId);
  dispatch(setBalanceHistoryForAccount({ accountId, history }));
}

/** Legacy entry: dispatch thunk (e.g. from UI). */
export async function loadBalanceHistoryForAccountId(
  accountId: string,
  dispatch: AppDispatch,
): Promise<void> {
  await dispatch(loadBalanceHistory(accountId)).unwrap();
}
