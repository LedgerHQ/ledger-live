import type { ReceiveAddressShown } from "../ReceiveAddressView.types";

export type AddressSummaryProps = Readonly<{
  address: ReceiveAddressShown;
  /** Copies the address from a press on the code, where the code is pressable. */
  onCopy?: () => void;
  /** Read by screen readers on the pressable code. */
  copyLabel?: string;
  /** Changes on each press of the Copy button, to play the code's copy animation too. */
  copyKey?: number;
}>;
