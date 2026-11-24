import type { AddressParts } from "../../logic/splitAddress";
import type { ReceiveIcon } from "../../logic/toReceiveAddressData";
import type { ReceiveAddressOptionId } from "../../logic/toReceiveAddressOptions";
import type { ReceiveNoticeKind, ReceiveNoticeTone } from "../../logic/toReceiveNotices";
import type { ReceiveServiceIncident } from "../../types";

/** The account data could not be read: Retry reads what failed again. */
export type ReceiveAddressError = Readonly<{
  title: string;
  description: string;
  retryLabel: string;
  onRetry: () => void;
}>;

/** The user picks one of several addresses (Zcash) before the screen shows it. */
export type ReceiveAddressSelectionView = Readonly<{
  title: string;
  options: readonly Readonly<{ id: ReceiveAddressOptionId; label: string }>[];
  onSelect: (id: ReceiveAddressOptionId) => void;
}>;

/** The address shown: what the QR encodes, and its text with the edges to compare. */
export type ReceiveAddressShown = Readonly<{
  value: string;
  parts: AddressParts;
  /** "Public address" / "Private address", when the account has several. */
  label?: string;
  /** Drawn in the middle of the QR code; absent while the asset metadata is unknown. */
  assetIcon?: ReceiveIcon;
}>;

type ReceiveAddressAction = Readonly<{ label: string; onPress: () => void }>;

/** Copy, Share (where the app can share) and Verify, under the address. */
export type ReceiveAddressActionsView = Readonly<{
  /** No address shown yet: the actions are there, but do nothing. */
  disabled: boolean;
  copy?: ReceiveAddressAction &
    Readonly<{
      hasCopied: boolean;
      /** Copies from a press on the QR code, which plays its own animation. */
      onPressCode: () => void;
      /** How many times the Copy button was pressed: the QR code replays its animation on each. */
      buttonPresses: number;
    }>;
  share?: Readonly<{ label: string; onPress: (cardImageUrl?: string) => void }>;
  /** `disabled` when the device cannot show this address. */
  verify?: ReceiveAddressAction & Readonly<{ disabled: boolean }>;
  /** Invites the user to verify, until they verify or dismiss it once. */
  verifyHint?: Readonly<{ message: string; gotItLabel: string; onGotIt: () => void }>;
}>;

export type ReceiveNoticeView = Readonly<{
  id: ReceiveNoticeKind;
  tone: ReceiveNoticeTone;
  text: string;
  learnMore?: ReceiveAddressAction;
}>;

export type ReceiveServiceWarningView = Readonly<{
  title: string;
  ctaLabel: string;
  onPress: () => void;
}>;

export type ReceiveServiceStatusView = Readonly<{
  title: string;
  incidents: readonly ReceiveServiceIncident[];
  gotItLabel: string;
  onClose: () => void;
}>;

export type ReceiveAddressViewProps = Readonly<{
  /** The address is not known yet: skeletons hold the place of the QR card and the address. */
  isLoading: boolean;
  error?: ReceiveAddressError;
  addressSelection?: ReceiveAddressSelectionView;
  /** Absent until the address is read, and while the user picks one. */
  address?: ReceiveAddressShown;
  actions: ReceiveAddressActionsView;
  /** A device verification runs: on desktop, its own dialog takes the place of this one. */
  isVerifying: boolean;
  notices: readonly ReceiveNoticeView[];
  serviceWarning?: ReceiveServiceWarningView;
  noticesPlaceholderLabel: string;
  serviceStatus?: ReceiveServiceStatusView;
  /** "Receive USDC" */
  title: string;
  /** "Ethereum network" */
  networkLabel: string;
  /** Absent until the network is known. */
  networkIcon?: ReceiveIcon;
  /** Set when the user picked this address among several (Zcash): back to that choice. */
  onBack?: () => void;
  closeLabel: string;
  backLabel: string;
  onClose: () => void;
}>;
