import type {
  AddAddressCurrencySelection,
  AddAddressFlowState,
  AddAddressInputSource,
} from "@features/flow-contacts";

export type ContactsAddAddressFlowDrawerProps = Readonly<{
  state: AddAddressFlowState;
  eligibleNetworkIds: readonly string[];
  onAddressChange: (value: string, inputMethod: AddAddressInputSource) => void;
  onAddressNameChange: (value: string) => void;
  onAddressConfirm: () => void;
  onBack: () => void;
  onClose: () => void;
  onContinueFromName: () => void;
  onCurrencySelected: (selection: AddAddressCurrencySelection) => void;
  onQrCodeClick: () => void;
}>;

export type ContactsAddAddressDrawerStep = "currency" | "address" | "name";
