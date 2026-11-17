import type { ReceiveIcon } from "../../logic/toReceiveAddressData";

/** The account data could not be read: Retry reads what failed again. */
export type ReceiveAddressError = Readonly<{
  title: string;
  description: string;
  retryLabel: string;
  onRetry: () => void;
}>;

export type ReceiveAddressViewProps = Readonly<{
  /** The address is not known yet: skeletons hold the place of the QR card and the address. */
  isLoading: boolean;
  error?: ReceiveAddressError;
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
