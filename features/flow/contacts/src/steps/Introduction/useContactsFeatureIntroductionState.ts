import { useCallback } from "react";
import type { ContactsFeatureIntroductionPreferencePort } from "./ports";
import { resolveContactsFeatureIntroductionRequested } from "./resolver";

export type UseContactsFeatureIntroductionStateInput = Readonly<{
  isContactsEntryAvailable: boolean;
  preference: ContactsFeatureIntroductionPreferencePort;
}>;

export type ContactsFeatureIntroductionState = Readonly<{
  isRequested: boolean;
  dismiss: () => void;
}>;

export function useContactsFeatureIntroductionState(
  input: UseContactsFeatureIntroductionStateInput,
): ContactsFeatureIntroductionState {
  const isRequested = resolveContactsFeatureIntroductionRequested({
    isContactsEntryAvailable: input.isContactsEntryAvailable,
    isDismissed: input.preference.isDismissed,
  });
  const dismiss = useCallback(() => {
    input.preference.markDismissed();
  }, [input.preference]);

  return {
    isRequested,
    dismiss,
  };
}
