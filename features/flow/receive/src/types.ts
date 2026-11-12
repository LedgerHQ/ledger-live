import type { ReceiveMemo } from "@domain/entity-account-receive";
import type { AccountGate, AssetActivationMethod, AssetGate } from "@domain/entity-account-status";
import type { AddressParts } from "./utils/splitAddress";

/**
 * Family contract of the receive flow. Each app's coin family implements it, so the flow never
 * branches on a family name.
 */
export type ReceiveNoticeId =
  | "utxo"
  | "taproot"
  | "dashStaking"
  | "tronInactiveAccount"
  | "tezosDelegation"
  | "zcashPrivateNotEnabled";

/**
 * - `device`: the Ledger app can display the address (default).
 * - `unavailable`: the device cannot display it; Verify is disabled with an explanation.
 */
export type ReceiveVerificationMode = "device" | "unavailable";

/** The memo or tag a sender can attach next to an address (`ReceiveAddress.memo`). */
export type ReceiveMemoType = ReceiveMemo["type"];

/** One of several addresses an account can receive on (Zcash transparent / shielded). */
export type ReceiveAddressOptionId = "transparent" | "shielded";

export type ReceiveAddressOption = Readonly<{
  id: ReceiveAddressOptionId;
  address: string;
  verification: ReceiveVerificationMode;
  memoType?: ReceiveMemoType;
}>;

/** How a token is activated on an account before it can be received (`assetStatus`). */
export type ReceiveAssetActivationKind = "association" | "optIn" | "trustline" | "authorize";

/** What stops an account receiving an asset: its onboarding, then the asset's gate. */
export type ReceiveGate = AccountGate | AssetGate;

/**
 * What a coin family adds to the receive screen. The address and how the device confirms it come
 * from the `receive` account data, whether the account can receive from `accountStatus` and `assetStatus`.
 */
export type ReceiveFamilyTraits = Readonly<{
  /** `false` sends the account back to the legacy receive flow. */
  isSupported: boolean;
  notices: readonly ReceiveNoticeId[];
  /** Device models whose app can no longer verify this family (DMK `DeviceModelId` values). */
  unsupportedDeviceModelIds?: readonly string[];
}>;

/** The family traits merged with the account's `AccountReceive`: what the screen renders. */
export type ReceiveFamilyConfig = ReceiveFamilyTraits &
  Readonly<{
    verification: ReceiveVerificationMode;
    /** What senders can attach next to the address (`AccountReceive.memo`), absent where nothing. */
    memoType?: ReceiveMemoType;
    /** How the token is activated, while the account must activate it first (`assetStatus`). */
    activationKind?: ReceiveAssetActivationKind;
    /** Several addresses to pick from, in a "Select address" step before the address screen. */
    addressOptions?: readonly ReceiveAddressOption[];
  }>;

export const DEFAULT_RECEIVE_FAMILY_TRAITS: ReceiveFamilyTraits = {
  isSupported: true,
  notices: [],
};

/** Why the address must not be shown at all. */
export type ReceiveBlockedReason =
  | "sanctioned"
  | "receiveUnavailable"
  | "readFailed"
  /** The account must first be onboarded on its network. */
  | "onboardingRequired"
  /** The token must first be activated on the account (association, opt-in, trustline, authorize). */
  | "assetActivationRequired"
  /** Whether the token is activated cannot be told from the account data: the legacy flow can. */
  | "assetActivationUnknown"
  /** The activation flow ended but the network does not report the token yet. */
  | "assetActivationPending";

export type ReceiveServiceIncident = Readonly<{
  title: string;
  description?: string;
}>;

export type ReceiveAddressActionId = "share" | "copy" | "verify";

export type ReceiveAddressAsset = Readonly<{
  name: string;
  ticker: string;
}>;

export type ReceiveAddressIconProps = Readonly<{
  ledgerId: string;
  ticker: string;
  network?: string;
}>;

export type ReceiveHelpArticleId = "receiveFromExchange" | "receiveSecurely";

export type AddressVerifyHint = Readonly<{
  open: boolean;
  onGotIt: () => void;
  onShown?: () => void;
}>;

/** What the host app resolves from the selected account and injects into the screen. */
export type ReceiveAddressProps = Readonly<{
  address: string;
  asset: ReceiveAddressAsset;
  network: string;
  assetIcon: ReceiveAddressIconProps;
  networkIcon?: ReceiveAddressIconProps;
  family: ReceiveFamilyConfig;
  /** The `receive` account data is still read: skeletons stand in for the address. */
  isLoadingAddress?: boolean;
  /** Host-side checks (sanctions) still running: the address stays hidden. */
  isCheckingAddress?: boolean;
  blockedReason?: ReceiveBlockedReason;
  /** Reads the `receive` account data again, offered when `blockedReason` is `readFailed`. */
  onRetry?: () => void;
  /** Hands over to the legacy receive flow, offered when it handles what blocks this screen. */
  onUseLegacyFlow?: () => void;
  /** Starts the family's activation flow, offered when `blockedReason` is `assetActivationRequired`. */
  onActivateAsset?: () => void;
  /** Open incidents on status.ledger.com for this currency. */
  serviceIncidents?: readonly ReceiveServiceIncident[];
  /** Actions rendered, in order. Desktop: copy + verify. Mobile adds share. */
  visibleActions: readonly ReceiveAddressActionId[];
  verifyHint?: AddressVerifyHint;
  onCopy: (address: string) => Promise<boolean>;
  onShare?: (address: string) => void;
  /** `addressOptionId` is set when the family offers several addresses. */
  onVerify: (address: string, addressOptionId?: ReceiveAddressOptionId) => void;
  onOpenHelpArticle: (id: ReceiveHelpArticleId) => void;
  onLearnMoreMemoTag: () => void;
  onClose: () => void;
}>;

export type ReceiveNotice = Readonly<{
  id: string;
  appearance: "info" | "warning";
  title?: string;
  message?: string;
}>;

export type ReceiveHelpArticle = Readonly<{
  id: ReceiveHelpArticleId;
  label: string;
}>;

/** The address screen, the address picker before it, or a panel its cards open in place. */
export type ReceiveAddressPanel = "selectAddress" | "address" | "memoTag" | "help";

export type ReceiveMemoTagCopy = Readonly<{
  cardTitle: string;
  title: string;
  description: string;
  learnMoreLabel: string;
  gotItLabel: string;
}>;

export type ReceiveHelpCopy = Readonly<{
  cardTitle: string;
  title: string;
  articles: readonly ReceiveHelpArticle[];
}>;

export type ReceiveAddressOptionRow = Readonly<{
  id: ReceiveAddressOptionId;
  label: string;
}>;

export type ReceiveAddressViewProps = Readonly<{
  title: string;
  networkLabel: string;
  assetIcon: ReceiveAddressIconProps;
  networkIcon?: ReceiveAddressIconProps;
  /** `loading`: no address yet. `checking`: host checks still running. `blocked`: never show the address. */
  status: "loading" | "checking" | "ready" | "blocked";
  blocked?: Readonly<{
    title: string;
    description: string;
    retryLabel?: string;
    onRetry?: () => void;
    legacyFlowLabel?: string;
    onUseLegacyFlow?: () => void;
    activateLabel?: string;
    onActivate?: () => void;
    /** `info` for a step the user can take (activation), `error` otherwise. */
    appearance: "info" | "error";
  }>;
  selectAddressTitle: string;
  addressOptions: readonly ReceiveAddressOptionRow[];
  onSelectAddressOption: (id: ReceiveAddressOptionId) => void;
  /** Set when the address was picked in the "Select address" step. */
  onBackToAddressSelection?: () => void;
  addressParts: AddressParts;
  qrPayload: string;
  visibleActions: readonly ReceiveAddressActionId[];
  isVerifyDisabled: boolean;
  verificationUnavailableMessage?: string;
  notices: readonly ReceiveNotice[];
  memoTag?: ReceiveMemoTagCopy;
  /** What senders can attach next to the address shown, absent where nothing. */
  memoType?: ReceiveMemoType;
  help: ReceiveHelpCopy;
  panel: ReceiveAddressPanel;
  verifyHint?: AddressVerifyHint;
  onCopy: () => Promise<boolean>;
  onShare: () => void;
  onVerify: () => void;
  onOpenPanel: (panel: "memoTag" | "help") => void;
  onBackToAddress: () => void;
  onOpenHelpArticle: (id: ReceiveHelpArticleId) => void;
  onLearnMoreMemoTag: () => void;
  onClose: () => void;
}>;

/** Host wiring of the "Address securely displayed" screen: Got it and close both leave the verification. */
export type AddressDisplayedProps = Readonly<{
  onGotIt: () => void;
  onClose: () => void;
}>;

export type AddressDisplayedViewProps = Readonly<{
  title: string;
  description: string;
  gotItCta: string;
  onGotIt: () => void;
  onClose: () => void;
}>;
