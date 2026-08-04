import type { ContactsFeatureIntroductionPreferencePort } from "./ports";

export type ContactsFeatureIntroductionPreferenceMock =
  ContactsFeatureIntroductionPreferencePort &
    Readonly<{
      reset: () => void;
    }>;

export function createContactsFeatureIntroductionPreferenceMock(
  initialDismissed = false,
): ContactsFeatureIntroductionPreferenceMock {
  let isDismissed = initialDismissed;

  return {
    get isDismissed() {
      return isDismissed;
    },
    markDismissed: () => {
      isDismissed = true;
    },
    reset: () => {
      isDismissed = initialDismissed;
    },
  };
}
