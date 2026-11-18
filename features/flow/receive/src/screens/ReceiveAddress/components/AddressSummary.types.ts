import type { ReceiveAddressShown } from "../ReceiveAddressView.types";

export type AddressSummaryProps = Readonly<{
  address: ReceiveAddressShown;
  onCopy?: () => void;
  copyLabel?: string;
  copyKey?: number;
}>;
