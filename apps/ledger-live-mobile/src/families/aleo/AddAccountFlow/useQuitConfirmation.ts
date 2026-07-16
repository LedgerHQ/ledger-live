import { useCallback, useRef, useState } from "react";

type Params = {
  onCloseNavigation?: () => void;
  onConfirm?: () => void;
};

export default function useQuitConfirmation({ onCloseNavigation, onConfirm }: Params) {
  const [isOpened, setIsOpened] = useState(false);
  // The drawer's onClose fires before the animated onModalHide, even on our own
  // close, so a ref (not state) is used to survive that and preserve intent.
  const shouldNavigateOnHideRef = useRef(false);

  const open = useCallback(() => setIsOpened(true), []);
  const close = useCallback(() => setIsOpened(false), []);

  const confirm = useCallback(() => {
    onConfirm?.();
    shouldNavigateOnHideRef.current = true;
    setIsOpened(false);
  }, [onConfirm]);

  const onModalHide = useCallback(() => {
    if (shouldNavigateOnHideRef.current) {
      shouldNavigateOnHideRef.current = false;
      onCloseNavigation?.();
    }
  }, [onCloseNavigation]);

  return { isOpened, open, close, confirm, onModalHide };
}
