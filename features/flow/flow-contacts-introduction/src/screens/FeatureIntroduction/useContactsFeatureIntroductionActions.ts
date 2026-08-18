import { useCallback, useEffect, useRef } from "react";

export type UseContactsFeatureIntroductionActionsInput = Readonly<{
  isOpen: boolean;
  onComplete: () => void;
  onClose: () => void;
}>;

export type ContactsFeatureIntroductionActions = Readonly<{
  complete: () => void;
  onClose: () => void;
}>;

export function useContactsFeatureIntroductionActions({
  isOpen,
  onComplete,
  onClose: onCloseCallback,
}: UseContactsFeatureIntroductionActionsInput): ContactsFeatureIntroductionActions {
  const hasCompleted = useRef(false);
  const hasClosed = useRef(false);

  useEffect(() => {
    if (isOpen) {
      hasCompleted.current = false;
      hasClosed.current = false;
    }
  }, [isOpen]);

  const complete = useCallback(() => {
    if (hasCompleted.current) {
      return;
    }

    hasCompleted.current = true;
    onComplete();
  }, [onComplete]);

  const onClose = useCallback(() => {
    if (hasCompleted.current || hasClosed.current) {
      return;
    }

    hasClosed.current = true;
    onCloseCallback();
  }, [onCloseCallback]);

  return { complete, onClose };
}
