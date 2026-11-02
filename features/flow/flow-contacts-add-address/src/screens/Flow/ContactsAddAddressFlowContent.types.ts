import type { AddAddressFlowState, AddAddressInputSource } from "../../state/types";

type OpenAddAddressFlowState = Exclude<AddAddressFlowState, { status: "closed" }>;

export type AddAddressFlowContentState = Exclude<
  OpenAddAddressFlowState,
  { status: "selectingCurrency" }
>;

export type ContactsAddAddressFlowContentProps = Readonly<{
  state: AddAddressFlowContentState;
  supportsDomain: boolean;
  onSanctionedAddressLearnMore?: () => void;
  onAddressChange: (address: string, inputMethod: AddAddressInputSource) => void;
  onScanQrCode?: () => void;
  onContinueFromAddressDetails: () => void;
  onAddressLabelChange: (label: string) => void;
  onContinueFromName: () => void;
  onContinueFromReview: () => void;
  /** @platform native Space the host keeps above the keyboard, in px. */
  bottomOffset?: number;
}>;
