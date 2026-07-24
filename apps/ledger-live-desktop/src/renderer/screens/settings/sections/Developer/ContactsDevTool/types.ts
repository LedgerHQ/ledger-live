import type { ContactsFeatureParams, ContactsFeatureValue } from "@features/flow-contacts";

export interface ContactsDevToolContentProps {
  readonly expanded: boolean;
}

export interface ContactsDevToolViewModel {
  readonly featureFlag: ContactsFeatureValue | null;
  readonly isEnabled: boolean;
  readonly params: ContactsFeatureParams;
  readonly customFamiliesInput: string;
  readonly hasDismissedFeatureIntroduction: boolean;
  readonly handleToggleEnabled: () => void;
  readonly handleToggleNewBadge: () => void;
  readonly handleToggleFeatureIntroductionDismissed: () => void;
  readonly handleSetEligibleAddressFamilies: (families: readonly string[]) => void;
  readonly setCustomFamiliesInput: (value: string) => void;
  readonly handleApplyCustomFamilies: () => void;
  readonly handleLoadPopulatedContacts: () => void;
  readonly handleResetContacts: () => void;
  readonly handleResetOverride: () => void;
}
