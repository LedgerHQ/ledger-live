import { isSwapOperationPending } from "./";
import { getMultipleStatus } from "./getStatus";
import type { SubAccount, Account, SwapOperation, Operation } from "@ledgerhq/types-live";
import type { SwapStatusRequest, UpdateAccountSwapStatus } from "./types";
import { log } from "@ledgerhq/logs";

const maybeGetUpdatedSwapHistory = async (
  swapHistory: SwapOperation[] | null | undefined,
  operations: Operation[] | null | undefined,
): Promise<SwapOperation[] | null | undefined> => {
  const pendingSwapIds: SwapStatusRequest[] = [];
  let accountNeedsUpdating = false;
  let consolidatedSwapHistory: SwapOperation[] = [];

  if (swapHistory) {
    for (const { provider, swapId, status, operationId } of swapHistory) {
      if (isSwapOperationPending(status)) {
        const transactionId =
          provider === "thorswap"
            ? operations?.find(o => o.id.includes(operationId))?.hash
            : undefined;
        pendingSwapIds.push({
          provider,
          swapId,
          transactionId,
          ...(provider === "thorswap" && { operationId }), // to be removed after Thorswap is fully migrated
        });
      }
    }

    if (pendingSwapIds.length) {
      const uniquePendingSwapIdsMap = new Map<string, SwapStatusRequest>();
      for (const item of pendingSwapIds) {
        const existingItem = uniquePendingSwapIdsMap.get(item.swapId);

        if (!existingItem) {
          uniquePendingSwapIdsMap.set(item.swapId, item);
        } else {
          if (item.transactionId && !existingItem.transactionId) {
            uniquePendingSwapIdsMap.set(item.swapId, item);
          }
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
      const newStatusList = await getMultipleStatus(uniquePendingSwapIds);
      consolidatedSwapHistory = swapHistory.map<SwapOperation>((swap: SwapOperation) => {
        const newStatus = newStatusList.find(s => s.swapId === swap.swapId);

        if (newStatus && newStatus.status !== swap.status) {
          accountNeedsUpdating = true;
          return { ...swap, status: newStatus.status };
        }

        return swap;
      });

      if (accountNeedsUpdating) {
        return consolidatedSwapHistory;
      }
    }
  }
};

const updateAccountSwapStatus: UpdateAccountSwapStatus = async (account: Account) => {
  const swapHistoryUpdated = await maybeGetUpdatedSwapHistory(
    account.swapHistory,
    account.operations,
  );
  let subAccountSwapHistoryUpdated = false;
  let subAccounts: SubAccount[] = [];

  if (account.type === "Account" && account.subAccounts?.length) {
    subAccounts = await Promise.all(
      account.subAccounts.map(async (subAccount: SubAccount): Promise<SubAccount> => {
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
