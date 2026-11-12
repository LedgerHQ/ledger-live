/** `newReceiveFlow` feature flag. */
export interface ReceiveFlagSectionProps {
  readonly enabled: boolean;
  /** Families sent back to the legacy receive flow (flag param). */
  readonly excludedFamilies: readonly string[];
  readonly setEnabled: (enabled: boolean) => void;
  readonly setExcludedFamilies: (families: readonly string[]) => void;
}

/** First-time "verify your address" hint on the receive address screen. */
export interface ReceiveVerifyHintSectionProps {
  readonly hasSeen: boolean;
  readonly setHasSeen: (hasSeen: boolean) => void;
}

export interface ReceiveToolAsset {
  /** Account id the host opens the receive screen for. */
  readonly id: string;
  readonly label: string;
  readonly ticker: string;
  /** Ledger currency id of the asset, for its icon. */
  readonly currencyId: string;
  /** Network name, and its currency id for the icon badge when the asset is a token. */
  readonly network: string;
  readonly networkId?: string;
}

export interface ReceiveTriggerSectionProps {
  /** One entry per account and token account the user holds. */
  readonly assets: readonly ReceiveToolAsset[];
  /** Opens the receive flow on this account, skipping asset selection. */
  readonly onReceive: (assetId: string) => void;
  /** Opens the receive flow from its asset selection step (any asset, even without an account). */
  readonly onPickAsset: () => void;
  /** Opens a `ledgerlive://` deeplink inside the app, as if the OS had handed it over. */
  readonly onOpenDeeplink: (url: string) => void;
}

/** One key per section, so a new control adds a key without touching the others. */
export interface ReceiveToolProps {
  readonly flag: ReceiveFlagSectionProps;
  readonly verifyHint: ReceiveVerifyHintSectionProps;
  readonly trigger: ReceiveTriggerSectionProps;
}
