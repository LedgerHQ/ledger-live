import { SwapOperation } from "@ledgerhq/types-live";

export default (
  existingSwapHistory: SwapOperation[] | null | undefined,
  importedSwapHistory: SwapOperation[] | null | undefined,
): SwapOperation[] => {
  const usedSwapIds: string[] = [];
  const dirtyJoin = [...(existingSwapHistory || []), ...(importedSwapHistory || [])];
  const cleanSwapHistory: SwapOperation[] = [];

  for (let i = dirtyJoin.length - 1; i >= 0; i--) {
    // Iterate backwards to prioritise imported swaps
    const swapOperation = dirtyJoin[i];
    if (usedSwapIds.includes(swapOperation.swapId)) continue;
    usedSwapIds.push(swapOperation.swapId);
    cleanSwapHistory.push(swapOperation);
  }

  return cleanSwapHistory;
};
