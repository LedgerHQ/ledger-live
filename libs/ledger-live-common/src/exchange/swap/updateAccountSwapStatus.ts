import BigNumber from "bignumber.js";
import { isSwapOperationPending } from "./";
import { getMultipleStatus } from "./getStatus";
import type {
  TokenAccount,
  Account,
  AccountLike,
  SwapOperation,
  Operation,
} from "@ledgerhq/types-live";
import type { SwapStatus, SwapStatusRequest, UpdateAccountSwapStatus } from "./types";
import { log } from "@ledgerhq/logs";
import { swapProviderRequiresOperationId } from "./providersRequiringOperationId";
import { TransactionStatus } from "@ledgerhq/wallet-api-exchange-module";

/**
 * Whether the swap is not anchored to an operation yet and still waits for its payout tx hash
 * (perps withdraw). It stays out of the swap history meanwhile, so a screen only checking the shown
 * swaps would never poll its status.
 */
export function isSwapAwaitingPayoutHash({ operationId, status }: SwapOperation): boolean {
  if (operationId) return false;
  // Expired is terminal, like refunded: no payout tx will ever come.
  if (status === TransactionStatus.Expired) return false;
  return isSwapOperationPending(status) || status === TransactionStatus.Finished;
}

/** Whether any of the (flattened) accounts holds a swap waiting for its payout tx hash. */
export function hasSwapsAwaitingPayoutHash(accounts: AccountLike[]): boolean {
  return accounts.some(account => account.swapHistory?.some(isSwapAwaitingPayoutHash));
}

const maybeGetUpdatedSwapHistory = async (
  swapHistory: SwapOperation[] | null | undefined,
  operations: Operation[] | null | undefined,
): Promise<SwapOperation[] | null | undefined> => {
  const pendingSwapIds: SwapStatusRequest[] = [];
  const atomicSwapIds: SwapStatus[] = [];
  let accountNeedsUpdating = false;
  let consolidatedSwapHistory: SwapOperation[] = [];

  if (swapHistory) {
    for (const swap of swapHistory) {
      const { provider, swapId, status, operationId } = swap;
      const updatedSwap: SwapOperation = { ...swap };

      // A finished entry not anchored to an operation yet is polled until its payout tx hash is known.
      const awaitsPayoutHash = !operationId && status === TransactionStatus.Finished;
      if (isSwapOperationPending(status) || awaitsPayoutHash) {
        // if swapId is in operationId, then we can get the status from the operation
        // it means DEX swap like Uniswap
        if (operationId && swapId && operationId.includes(swapId)) {
          const operation = operations?.find(o => o.id.includes(operationId));
          if (operation) {
            let newStatus;
            if (operation.blockHeight != null) {
              newStatus = operation.hasFailed
                ? TransactionStatus.Refunded
                : TransactionStatus.Finished;
            } else {
              newStatus = TransactionStatus.Pending;
            }
            if (newStatus !== swap.status) {
              accountNeedsUpdating = true;
              updatedSwap.status = newStatus;
              atomicSwapIds.push({ provider, swapId, status: newStatus });
            }
          }
        } else {
          // Collect all others swaps that need status update via getMultipleStatus
          const requiresOperationId = swapProviderRequiresOperationId(provider);
          const relatedTransactionId = requiresOperationId
            ? operations?.find(op => op.id.includes(operationId))?.hash
            : undefined;
          pendingSwapIds.push({
            provider,
            swapId,
            transactionId: relatedTransactionId,
            ...(requiresOperationId && { operationId }),
          });
        }
      }
    }
    if (pendingSwapIds.length || atomicSwapIds.length) {
      const uniquePendingSwapIdsMap = new Map<string, SwapStatusRequest>();
      for (const item of pendingSwapIds) {
        if (item.provider === "uniswap") {
          continue;
        }
        const existingItem = uniquePendingSwapIdsMap.get(item.swapId);
        if (!existingItem) {
          uniquePendingSwapIdsMap.set(item.swapId, item);
        } else if (item.transactionId && !existingItem.transactionId) {
          uniquePendingSwapIdsMap.set(item.swapId, item);
        }
      }
      const uniquePendingSwapIds = Array.from(uniquePendingSwapIdsMap.values());

      if (uniquePendingSwapIds.length !== pendingSwapIds.length) {
        log(
          "error",
          "swap: duplicate ids inside app.json, number",
          pendingSwapIds.length - uniquePendingSwapIds.length,
        );
      }

      const newStatusList = pendingSwapIds.length
        ? await getMultipleStatus(uniquePendingSwapIds)
        : [];
      newStatusList.push(...atomicSwapIds);
      consolidatedSwapHistory = swapHistory.map<SwapOperation>((swap: SwapOperation) => {
        const newStatus = newStatusList.find(s => s.swapId === swap.swapId);

        if (newStatus) {
          const statusChanged = newStatus.status !== swap.status;
          const hasValidFinalAmount = newStatus.finalAmount != null && newStatus.finalAmount !== "";
          const finalAmountChanged =
            hasValidFinalAmount && newStatus.finalAmount !== swap.finalAmount?.toString();

          const anchorsOperation = !swap.operationId && Boolean(newStatus.txHash);

          if (statusChanged || finalAmountChanged || anchorsOperation) {
            accountNeedsUpdating = true;
            return {
              ...swap,
              status: newStatus.status,
              ...(anchorsOperation && { operationId: newStatus.txHash }),
              ...(hasValidFinalAmount && {
                finalAmount: new BigNumber(newStatus.finalAmount!),
              }),
            };
          }
        }

        return swap;
      });
    }

    if (accountNeedsUpdating) {
      return consolidatedSwapHistory;
    }
  }
};

const updateAccountSwapStatus: UpdateAccountSwapStatus = async (account: Account) => {
  const swapHistoryUpdated = await maybeGetUpdatedSwapHistory(
    account.swapHistory,
    account.operations,
  );
  let subAccountSwapHistoryUpdated = false;
  let subAccounts: TokenAccount[] = [];

  if (account.type === "Account" && account.subAccounts?.length) {
    subAccounts = await Promise.all(
      account.subAccounts.map(async (subAccount: TokenAccount): Promise<TokenAccount> => {
        const updatedSwapHistory = await maybeGetUpdatedSwapHistory(
          subAccount.swapHistory,
          subAccount.operations,
        );
        //As soon as we get one update, we will need to update the parent account
        if (updatedSwapHistory) subAccountSwapHistoryUpdated = true;
        return {
          ...subAccount,
          swapHistory: updatedSwapHistory || subAccount.swapHistory,
        };
      }),
    );
  }

  if (swapHistoryUpdated || subAccountSwapHistoryUpdated) {
    return {
      ...account,
      swapHistory: swapHistoryUpdated || account.swapHistory,
      subAccounts,
    };
  }
};

export default updateAccountSwapStatus;
