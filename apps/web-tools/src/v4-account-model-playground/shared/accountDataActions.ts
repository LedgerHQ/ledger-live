/**
 * Account data load – async thunk in shared (no cross-deps between slices).
 *
 * **Legacy (bridge) path only**: This thunk is for the full-sync flow: one bridge.sync()
 * returns the full Account, we split and push to all slices (accounts, operationHistory,
 * balanceHistory, accountCoinResources). One load fills everything.
 *
 * **Alpaca path**: We do NOT "tout load" here. Each section (account display, operations list,
 * balance history) should trigger its own slice-optimized fetch (e.g. loadOperations only,
 * loadBalanceHistory only). For Alpaca, the UI uses per-section loaders; this thunk is only
 * used when we still need a minimal account+balance payload for the account card (and we
 * return empty ops/history so we don’t pretend to fill those slices).
 */
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppDispatch } from "../store";
import { fetchAccountDataUpdates } from "../data-layer/accounts/actions";

export const loadAccountData = createAsyncThunk("accountData/load", (accountId: string) =>
  fetchAccountDataUpdates(accountId),
);

/** Legacy entry: dispatch loadAccountData thunk (use from UI or balanceHistory load). */
export async function loadAccountsForAccountId(
  accountId: string,
  dispatch: AppDispatch,
): Promise<void> {
  await dispatch(loadAccountData(accountId)).unwrap();
}
