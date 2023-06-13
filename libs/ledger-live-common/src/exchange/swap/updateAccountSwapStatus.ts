import { isSwapOperationPending } from "./";
import { getMultipleStatus } from "./getStatus";
import type { SubAccount, Account } from "@ledgerhq/types-live";
import type { SwapOperation, SwapStatusRequest, UpdateAccountSwapStatus } from "./types";

const maybeGetUpdatedSwapHistory = async (
  swapHistory: SwapOperation[] | null | undefined,
): Promise<SwapOperation[] | null | undefined> => {
  const pendingSwapIds: SwapStatusRequest[] = [];
  let accountNeedsUpdating = false;
  let consolidatedSwapHistory: SwapOperation[] = [];

  if (swapHistory) {
    for (const { provider, swapId, status } of swapHistory) {
      if (isSwapOperationPending(status)) {
        pendingSwapIds.push({
          provider,
          swapId,
        });
      }
    }

    if (pendingSwapIds.length) {
      const newStatusList = await getMultipleStatus(pendingSwapIds);
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
  const swapHistoryUpdated = await maybeGetUpdatedSwapHistory(account.swapHistory);
  let subAccountSwapHistoryUpdated = false;
  let subAccounts: SubAccount[] = [];

  if (account.type === "Account" && account.subAccounts?.length) {
    subAccounts = await Promise.all(
      account.subAccounts.map(async (subAccount: SubAccount): Promise<SubAccount> => {
        const updatedSwapHistory = await maybeGetUpdatedSwapHistory(subAccount.swapHistory);
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
