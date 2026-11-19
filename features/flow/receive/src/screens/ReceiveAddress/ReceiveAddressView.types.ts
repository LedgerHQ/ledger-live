import type { AddressParts } from "../../logic/splitAddress";
import type { ReceiveIcon } from "../../logic/toReceiveAddressData";
import type { ReceiveAddressOptionId } from "../../logic/toReceiveAddressOptions";
import type { ReceiveScreenData } from "./useReceiveScreenData";

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

export type ReceiveAddressViewProps = Readonly<{
  data: ReceiveScreenData;
  addressSelection?: ReceiveAddressSelectionView;
  /** Absent until the address is read, and while the user picks one. */
  address?: ReceiveAddressShown;
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
