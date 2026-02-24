/**
 * Top-level selectors that compose all slices to expose a single "account view".
 * See README §2.1: sync selector for reconstruction input; use
 * reconstructAccountFromReconstructionInput(input) for the async legacy Account.
 */
import { emptyHistoryCache } from "@ledgerhq/live-common/account/index";
import type { RootState } from "./index";
import type { AccountReconstructionInput } from "../shared/compatibility";
import { selectAccountById } from "../data-layer/accounts/selectors";
import { selectOperationHistoryByAccountId } from "../data-layer/operationHistory/selectors";
import { selectPendingOperationsByAccountId } from "../data-layer/transactional/selectors";
import { selectBalanceHistoryByAccountId } from "../data-layer/balanceHistory/selectors";
import { selectAccountCoinResourcesByAccountId } from "../data-layer/accountCoinResources/selectors";

/**
 * Returns the bundle of slice data needed to reconstruct the full legacy Account
 * for the given (main) account id, or undefined if the account is not in the store.
 * Use with reconstructAccountFromReconstructionInput(input) for the async step.
 * pendingOperations come from the transactional slice.
 */
export function selectAccountReconstructionInput(
  state: RootState,
  accountId: string,
): AccountReconstructionInput | undefined {
  const accountV4 = selectAccountById(state, accountId);
  if (!accountV4) return undefined;

  const operationEntry = selectOperationHistoryByAccountId(state, accountId);
  const pendingOperations = selectPendingOperationsByAccountId(state, accountId);
  const balanceHistory = selectBalanceHistoryByAccountId(state, accountId);
  const accountCoinResources = selectAccountCoinResourcesByAccountId(state, accountId);

  return {
    accountV4,
    operations: operationEntry?.operations ?? [],
    pendingOperations,
    balanceHistory: balanceHistory ?? emptyHistoryCache,
    accountCoinResources: accountCoinResources ?? {},
  };
}
