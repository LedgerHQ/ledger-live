export const CONTACTS_FEATURE_INTRODUCTION_DISMISSED_PREFERENCE =
  "hasDismissedContactsFeatureIntroduction" as const;

/** Injected by app wiring; aligns with the future @features/platform-contacts contract. */
export type ContactsFeatureIntroductionPreferencePort = Readonly<{
  isDismissed: boolean;
  markDismissed: () => void;
}>;
