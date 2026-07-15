import { useEffect, useRef } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { fromSwapOperation } from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import type {
  MappedSwapOperation,
  SwapHistorySection,
} from "@ledgerhq/live-common/exchange/swap/types";
import { openSwapTransactionStatusDialog } from "LLD/features/SwapTransactionStatusDialog/swapTransactionStatusDialog";

/**
 * Opens the swap transaction status dialog for the operation matching `autoOpenSwapId`
 * as soon as it appears in the loaded history sections.
 *
 * Tracks the last auto-opened swapId (rather than a one-shot flag) so it keeps retrying
 * across syncs until a match is found, and re-opens if a different swapId is passed to an
 * already-mounted screen.
 */
export function useAutoOpenSwapDialog(
  autoOpenSwapId: string | undefined,
  sections: SwapHistorySection[] | undefined | null,
) {
  const dispatch = useDispatch();
  const lastAutoOpenedSwapId = useRef<string | null>(null);

  useEffect(() => {
    if (!autoOpenSwapId || lastAutoOpenedSwapId.current === autoOpenSwapId) return;
    if (!sections?.length) return;

    let openedOperation: MappedSwapOperation | undefined;
    for (const section of sections) {
      openedOperation = section.data.find(({ swapId }) => swapId === autoOpenSwapId);
      if (openedOperation) break;
    }

    if (openedOperation) {
      lastAutoOpenedSwapId.current = autoOpenSwapId;
      dispatch(openSwapTransactionStatusDialog(fromSwapOperation(openedOperation)));
    }
  }, [autoOpenSwapId, dispatch, sections]);
}
