import type { AddressParts } from "../../logic/splitAddress";
import type { ReceiveIcon } from "../../logic/toReceiveAddressData";
import type { ReceiveAddressOptionId } from "../../logic/toReceiveAddressOptions";

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
  copy?: ReceiveAddressAction & Readonly<{ hasCopied: boolean }>;
  share?: ReceiveAddressAction;
  /** `disabled` when the device cannot show this address. */
  verify?: ReceiveAddressAction & Readonly<{ disabled: boolean }>;
  /** Invites the user to verify, until they verify or dismiss it once. */
  verifyHint?: Readonly<{ message: string; gotItLabel: string; onGotIt: () => void }>;
}>;

export type ReceiveAddressViewProps = Readonly<{
  /** The address is not known yet: skeletons hold the place of the QR card and the address. */
  isLoading: boolean;
  error?: ReceiveAddressError;
  addressSelection?: ReceiveAddressSelectionView;
  /** Absent until the address is read, and while the user picks one. */
  address?: ReceiveAddressShown;
  actions: ReceiveAddressActionsView;
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
