export type SectionHeaderProps = {
  readonly title: string;
};

export type ContactsDevToolHeaderProps = {
  readonly onRestoreDefaults: () => void;
};

export type ContactsEnabledToggleProps = {
  readonly isEnabled: boolean;
  readonly onToggle: () => void;
};

export type ContactsSampleDataSectionProps = {
  readonly onLoadSamples: () => void;
  readonly onClearContacts: () => void;
};

export type FeatureParamRowProps = {
  readonly label: string;
  readonly isFeatureEnabled: boolean;
  readonly value: boolean;
  readonly onToggle: () => void;
  readonly testID?: string;
};

export type EligibleAddressFamiliesSectionProps = {
  readonly isEnabled: boolean;
  readonly families: readonly string[];
  readonly onPresetSelect: (families: readonly string[]) => void;
};

export type FeatureFlagPreviewProps = {
  readonly summary: string;
};
