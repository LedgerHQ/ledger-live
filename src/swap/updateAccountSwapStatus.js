// @flow

import { getMultipleStatus } from "./getStatus";
import type { AccountLike } from "../types";
import type { UpdateAccountSwapStatus, SwapOperation } from "./types";

const pendingStatusList = [
  "new",
  "confirming",
  "exchanging",
  "sending",
  "waiting",
];

const updateAccountSwapStatus: UpdateAccountSwapStatus = async (
  account: AccountLike
) => {
  const pendingSwapIds = [];
  const history: ?(SwapOperation[]) = account.swapHistory;
  if (!history) {
    return account;
  }

  for (const { provider, swapId, status } of history) {
    if (pendingStatusList.includes(status)) {
      pendingSwapIds.push({ provider, swapId });
    }
  }
  if (pendingSwapIds.length) {
    // Fetch new swapIds
    let accountNeedsUpdating = false;
    const newStatusList = await getMultipleStatus(pendingSwapIds);
    const consolidatedSwapHistory = history.map<SwapOperation>(
      (swap: SwapOperation) => {
        const newStatus = newStatusList.find((s) => s.swapId === swap.swapId);
        if (newStatus && newStatus.status !== swap.status) {
          accountNeedsUpdating = true;
          return { ...swap, status: newStatus.status };
        }
        return swap;
      }
    );

    // Update the swaphistory for account if needed
    if (accountNeedsUpdating) {
      return {
        ...account,
        swapHistory: consolidatedSwapHistory,
      };
    }
  }

  return account;
};

export default updateAccountSwapStatus;
