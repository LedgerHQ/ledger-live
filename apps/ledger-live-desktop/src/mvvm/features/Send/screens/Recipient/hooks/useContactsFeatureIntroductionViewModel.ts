import { useMemo } from "react";
import {
  useContactsFeatureIntroductionState,
  type ContactsFeatureIntroduction,
} from "@features/flow-contacts-introduction";
import { useContactsFeatureIntroductionPreference } from "LLD/features/Contacts/hooks/useContactsFeatureIntroductionPreference";

type UseContactsFeatureIntroductionViewModelInput = Readonly<{
  isContactsEntryAvailable: boolean;
  /** Defaults to dismissing, otherwise the introduction reopens right away. */
  onClose?: () => void;
}>;

export function useContactsFeatureIntroductionViewModel({
  isContactsEntryAvailable,
  onClose,
}: UseContactsFeatureIntroductionViewModelInput): ContactsFeatureIntroduction {
  const preference = useContactsFeatureIntroductionPreference();
  const { isRequested, dismiss } = useContactsFeatureIntroductionState({
    isContactsEntryAvailable,
    preference,
  });

  return useMemo(
    () => ({
      isOpen: isRequested,
      onComplete: dismiss,
      onClose: onClose ?? dismiss,
    }),
    [dismiss, isRequested, onClose],
  );
}
