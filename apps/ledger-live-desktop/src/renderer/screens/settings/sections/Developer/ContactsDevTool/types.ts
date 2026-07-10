import { Feature } from "@shared/feature-flags";

export interface ContactsDevToolContentProps {
  readonly expanded: boolean;
}

export interface ContactsFeatureParams {
  readonly newBadge: boolean;
  readonly eligibleAddressFamilies: readonly string[];
}

export interface ContactsDevToolViewModel {
  readonly featureFlag: Feature | null;
  readonly isEnabled: boolean;
  readonly params: ContactsFeatureParams;
  readonly customFamiliesInput: string;
  readonly handleToggleEnabled: () => void;
  readonly handleToggleNewBadge: () => void;
  readonly handleSetEligibleAddressFamilies: (families: readonly string[]) => void;
  readonly setCustomFamiliesInput: (value: string) => void;
  readonly handleApplyCustomFamilies: () => void;
  readonly handleResetOverride: () => void;
}
