import type { ReceiveSanctionedView } from "../ReceiveAddressView.types";

export type SanctionedAddressProps = Readonly<{
  sanctioned: ReceiveSanctionedView;
}>;
