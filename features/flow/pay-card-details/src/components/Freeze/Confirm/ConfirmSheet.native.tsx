import React, { useCallback, useEffect, useRef } from "react";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { ConfirmError } from "./ConfirmError";
import { ConfirmPrompt } from "./ConfirmPrompt";
import type { ConfirmSheetProps } from "../../../types";

export function ConfirmSheet({ status, confirmState, onConfirm, onClose }: ConfirmSheetProps) {
  const dismissed = useRef(false);

  const isOpen = confirmState !== "closed";
  const isPending = confirmState === "pending";

  useEffect(() => {
    if (isOpen) {
      dismissed.current = false;
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (isPending || dismissed.current) {
      return;
    }
    dismissed.current = true;
    onClose();
  }, [isPending, onClose]);

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={handleClose}
      enableDynamicSizing
      testID="freeze-confirm-sheet"
    >
      {isOpen ? (
        <BottomSheetView testID="freeze-confirm-sheet-content">
          <BottomSheetHeader density="compact" spacing />
          {confirmState === "error" ? (
            <ConfirmError status={status} onConfirm={onConfirm} onClose={handleClose} />
          ) : (
            <ConfirmPrompt
              status={status}
              isPending={isPending}
              onConfirm={onConfirm}
              onClose={handleClose}
            />
          )}
        </BottomSheetView>
      ) : null}
    </QueuedBottomSheet>
  );
}
