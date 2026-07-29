export const CONTACTS_FEATURE_INTRODUCTION_DISMISSED_PREFERENCE =
  "hasDismissedContactsFeatureIntroduction" as const;

export type ContactsFeatureIntroductionPreferencePort = Readonly<{
  isDismissed: boolean;
  markDismissed: () => void;
}>;
