import { useCallback, useEffect, useRef } from "react";

type Params = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
};

export type AddToWalletBottomSheetViewProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
};

export function useAddToWalletBottomSheetViewModel({
  isOpen,
  onClose,
}: Params): AddToWalletBottomSheetViewProps {
  const dismissed = useRef(false);

  useEffect(() => {
    if (isOpen) {
      dismissed.current = false;
    }
  }, [isOpen]);

  const closeOnce = useCallback(() => {
    if (dismissed.current) {
      return;
    }

    dismissed.current = true;
    onClose();
  }, [onClose]);

  return { isOpen, onClose: closeOnce };
}
