export interface ReceiveFlagSectionProps {
  readonly enabled: boolean;
  /** Families that keep the legacy receive flow while the flag is on. */
  readonly excludedFamilies: readonly string[];
  readonly setEnabled: (enabled: boolean) => void;
  readonly setExcludedFamilies: (families: readonly string[]) => void;
}

/** One key per section, so a new receive control adds a key without touching the others. */
export interface ReceiveToolProps {
  readonly flag: ReceiveFlagSectionProps;
}
