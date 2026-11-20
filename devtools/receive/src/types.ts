export interface ReceiveFlagSectionProps {
  readonly enabled: boolean;
  /** Families that keep the legacy receive flow while the flag is on. */
  readonly excludedFamilies: readonly string[];
  readonly setEnabled: (enabled: boolean) => void;
  readonly setExcludedFamilies: (families: readonly string[]) => void;
}

/** Where the host opens receive: a main account by its legacy id, and the coin or token to receive. */
export interface ReceiveToolTarget {
  readonly legacyAccountId: string;
  readonly assetId: string;
}

export interface ReceiveToolAsset extends ReceiveToolTarget {
  readonly id: string;
  readonly label: string;
  readonly ticker: string;
  readonly currencyId: string;
  readonly network: string;
  /** Set for a token only: its network badge on the icon. */
  readonly networkId?: string;
}

export interface ReceiveTriggerSectionProps {
  /** Each account, then each token it holds. */
  readonly assets: readonly ReceiveToolAsset[];
  readonly onReceive: (target: ReceiveToolTarget) => void;
  readonly onPickAsset: () => void;
  readonly onOpenDeeplink: (url: string) => void;
}

/** One key per section, so a new receive control adds a key without touching the others. */
export interface ReceiveToolProps {
  readonly flag: ReceiveFlagSectionProps;
  readonly trigger: ReceiveTriggerSectionProps;
}
