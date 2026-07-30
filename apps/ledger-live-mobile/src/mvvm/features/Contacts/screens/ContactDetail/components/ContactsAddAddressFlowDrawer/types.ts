import type {
  AddAddressCurrencySelection,
  AddAddressFlowState,
  AddAddressInputSource,
} from "@features/flow-contacts";

export type ContactsAddAddressFlowDrawerProps = Readonly<{
  state: AddAddressFlowState;
  eligibleNetworkIds: readonly string[];
  onAddressChange: (value: string, inputMethod: AddAddressInputSource) => void;
  onAddressConfirm: () => void;
  onBack: () => void;
  onClose: () => void;
  onContinueFromName: () => void;
  onContinueFromReview: () => void;
  onCurrencySelected: (selection: AddAddressCurrencySelection) => void;
  onQrCodeClick: () => void;
}>;

export type ContactsAddAddressDrawerStep = "currency" | "address" | "name" | "review" | "success";
