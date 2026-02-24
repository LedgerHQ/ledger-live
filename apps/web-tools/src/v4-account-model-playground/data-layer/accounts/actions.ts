/**
 * Accounts domain – fetch logic (bridge full sync vs Alpaca).
 * Returns payload only; thunks in shared dispatch intent; reducers apply load logic.
 *
 * **Bridge (legacy)**: fetchAccountDataUpdates = one full sync → payload for ALL slices.
 * **Alpaca**: minimal payload (account + balance + coin resources only); ops/history empty —
 * those are loaded per-slice when the user opens Operations or Balance history.
 */
import { emptyHistoryCache } from "@ledgerhq/live-common/account/index";
import type { BalanceHistoryCache } from "@ledgerhq/types-live";
import { isAlpacaForAccountId } from "../../shared/syncStrategy";
import { fetchAccountDataViaAlpaca } from "./fetchAccountViaAlpaca";
import { syncAccountViaBridge, splitAccountIntoSliceUpdates } from "../../shared/compatibility";
import type { AccountV4 } from "./schema";
import type { AccountCoinResources } from "../accountCoinResources/schema";
import { operationToStored } from "../operationHistory/actions";
import type { StoredOperation } from "../operationHistory/schema";

/** Payload returned by fetchAccountDataUpdates; reducers apply this into each slice. */
export interface AccountDataLoadPayload {
  accountV4: AccountV4;
  operations: StoredOperation[];
  pendingOperations: StoredOperation[];
  balanceHistory: BalanceHistoryCache;
  accountCoinResources: AccountCoinResources;
  tokenAccountIds: string[];
  tokenAccountOperations: {
    accountId: string;
    operations: StoredOperation[];
    pendingOperations: StoredOperation[];
  }[];
}

/**
 * Fetch account data. Returns payload only; no dispatch.
 * - **Bridge**: full sync → payload fills all slices (account, ops, balanceHistory, coin resources).
 * - **Alpaca**: minimal payload (account + balance + coin resources only); ops/history empty —
 *   those are loaded per-slice when the user opens Operations or Balance history.
 */
export async function fetchAccountDataUpdates(accountId: string): Promise<AccountDataLoadPayload> {
  const isAlpaca = isAlpacaForAccountId(accountId);
  if (isAlpaca) {
    const updates = await fetchAccountDataViaAlpaca(accountId);
    return {
      accountV4: updates.accountV4,
      operations: [],
      pendingOperations: [],
      balanceHistory: emptyHistoryCache,
      accountCoinResources: updates.accountCoinResources,
      tokenAccountIds: [],
      tokenAccountOperations: [],
    };
  }
  const account = await syncAccountViaBridge(accountId);
  const updates = splitAccountIntoSliceUpdates(account);
  const tokenAccountOperations = (account.subAccounts ?? []).map(ta => ({
    accountId: ta.id,
    operations: (ta.operations ?? []).map(operationToStored),
    pendingOperations: (ta.pendingOperations ?? []).map(operationToStored),
  }));
  return {
    accountV4: updates.accountV4,
    operations: updates.operations.map(operationToStored),
    pendingOperations: updates.pendingOperations.map(operationToStored),
    balanceHistory: updates.balanceHistory,
    accountCoinResources: updates.accountCoinResources,
    tokenAccountIds: updates.tokenAccountIds,
    tokenAccountOperations,
  };
}
