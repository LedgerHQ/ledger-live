import { useCallback, useEffect, useRef } from "react";

export type UseContactsFeatureIntroductionActionsInput = Readonly<{
  isOpen: boolean;
  onComplete: () => void;
  onDefer: () => void;
}>;

export type ContactsFeatureIntroductionActions = Readonly<{
  complete: () => void;
  defer: () => void;
  onClose: () => void;
}>;

export function useContactsFeatureIntroductionActions({
  isOpen,
  onComplete,
  onDefer,
}: UseContactsFeatureIntroductionActionsInput): ContactsFeatureIntroductionActions {
  const hasCompleted = useRef(false);
  const hasDeferred = useRef(false);

  useEffect(() => {
    if (isOpen) {
      hasCompleted.current = false;
      hasDeferred.current = false;
    }
  }, [isOpen]);

  const complete = useCallback(() => {
    if (hasCompleted.current) {
      return;
    }

    hasCompleted.current = true;
    onComplete();
  }, [onComplete]);

  const defer = useCallback(() => {
    if (hasDeferred.current) {
      return;
    }

    hasDeferred.current = true;
    onDefer();
  }, [onDefer]);

  const onClose = useCallback(() => {
    if (!hasCompleted.current) {
      defer();
    }
  }, [defer]);

  return { complete, defer, onClose };
}
