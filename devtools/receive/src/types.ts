export interface ReceiveFlagSectionProps {
  readonly enabled: boolean;
  /** Families that keep the legacy receive flow while the flag is on. */
  readonly excludedFamilies: readonly string[];
  readonly setEnabled: (enabled: boolean) => void;
  readonly setExcludedFamilies: (families: readonly string[]) => void;
}

export interface ReceiveToolAsset {
  /** The account the host opens receive on. */
  readonly id: string;
  readonly label: string;
  readonly ticker: string;
  readonly currencyId: string;
  readonly network: string;
  /** Set for a token only: its network badge on the icon. */
  readonly networkId?: string;
}

export interface ReceiveTriggerSectionProps {
  /** Every account and token account. */
  readonly assets: readonly ReceiveToolAsset[];
  readonly onReceive: (assetId: string) => void;
  readonly onPickAsset: () => void;
  readonly onOpenDeeplink: (url: string) => void;
}

/** One key per section, so a new receive control adds a key without touching the others. */
export interface ReceiveToolProps {
  readonly flag: ReceiveFlagSectionProps;
  readonly trigger: ReceiveTriggerSectionProps;
}
