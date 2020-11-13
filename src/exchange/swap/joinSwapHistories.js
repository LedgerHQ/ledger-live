// @flow
import type { SwapOperation } from "./types";

export default (
  existingSwapHistory: ?(SwapOperation[]),
  importedSwapHistory: ?(SwapOperation[])
) => {
  const usedSwapIds = [];
  const dirtyJoin = [
    ...(existingSwapHistory || []),
    ...(importedSwapHistory || []),
  ];
  let cleanSwapHistory = [];
  for (let i = dirtyJoin.length - 1; i >= 0; i--) {
    // Iterate backwards to prioritise imported swaps
    const swapOperation = dirtyJoin[i];
    if (usedSwapIds.includes(swapOperation.swapId)) continue;
    usedSwapIds.push(swapOperation.swapId);
    cleanSwapHistory.push(swapOperation);
  }
  return cleanSwapHistory;
};
