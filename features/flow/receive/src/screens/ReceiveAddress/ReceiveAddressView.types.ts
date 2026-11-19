import type { ReceiveIcon } from "../../logic/toReceiveAddressData";
import type { ReceiveScreenData } from "./useReceiveScreenData";

export type ReceiveAddressViewProps = Readonly<{
  data: ReceiveScreenData;
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
