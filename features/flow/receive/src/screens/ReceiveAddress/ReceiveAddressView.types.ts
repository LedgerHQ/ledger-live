import type { AddressParts } from "../../logic/splitAddress";
import type { ReceiveIcon } from "../../logic/toReceiveAddressData";
import type { ReceiveAddressOptionId } from "../../logic/toReceiveAddressOptions";
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
  /** Drawn in the middle of the QR code. */
  assetIcon: ReceiveIcon;
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
  share?: ReceiveAddressAction;
  /** `disabled` when the device cannot show this address. */
  verify?: ReceiveAddressAction & Readonly<{ disabled: boolean }>;
  /** Invites the user to verify, until they verify or dismiss it once. */
  verifyHint?: Readonly<{ message: string; gotItLabel: string; onGotIt: () => void }>;
}>;

/** A banner under the actions. */
export type ReceiveNoticeView = Readonly<{
  id: string;
  tone: "info" | "warning";
  text: string;
  learnMore?: ReceiveAddressAction;
}>;

/** A service incident on the network: its banner opens the incidents. */
export type ReceiveServiceWarningView = Readonly<{
  title: string;
  ctaLabel: string;
  onPress: () => void;
}>;

/** The open incidents, over the address. */
export type ReceiveServiceStatusView = Readonly<{
  title: string;
  incidents: readonly ReceiveServiceIncident[];
  gotItLabel: string;
  onClose: () => void;
}>;

/** "Need a Tag/Memo?", when senders can attach one to the address shown. */
export type ReceiveMemoCardView = Readonly<{ title: string; onPress: () => void }>;

/** Why an exchange may need a memo, over the address. */
export type ReceiveMemoPanelView = Readonly<{
  title: string;
  description: string;
  gotItLabel: string;
  learnMore?: ReceiveAddressAction;
  onClose: () => void;
}>;

/** "Need support? Get help". */
export type ReceiveHelpCardView = Readonly<{ title: string; onPress: () => void }>;

/** The support questions, over the address. */
export type ReceiveHelpPanelView = Readonly<{
  title: string;
  questions: readonly (ReceiveAddressAction & Readonly<{ id: string }>)[];
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
  notices: readonly ReceiveNoticeView[];
  serviceWarning?: ReceiveServiceWarningView;
  /** Set while the incidents are open. */
  serviceStatus?: ReceiveServiceStatusView;
  memoCard?: ReceiveMemoCardView;
  /** Set while the memo panel is open. */
  memoPanel?: ReceiveMemoPanelView;
  helpCard?: ReceiveHelpCardView;
  /** Set while the help is open. */
  helpPanel?: ReceiveHelpPanelView;
  /** "Receive USDC" */
  title: string;
  /** "Ethereum network" */
  networkLabel: string;
  /** Absent until the network is known. */
  networkIcon?: ReceiveIcon;
  /** Set when the user picked this address among several (Zcash): back to that choice. */
  onBack?: () => void;
  onClose: () => void;
}>;
