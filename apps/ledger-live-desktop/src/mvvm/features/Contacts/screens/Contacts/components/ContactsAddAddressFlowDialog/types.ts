import type {
  AddAddressFlowState,
  AddAddressInputSource,
  ContactsAddAddressEntryLabels,
} from "@features/flow-contacts";

export type ContactsAddAddressFlowDialogProps = Readonly<{
  state: AddAddressFlowState;
  labels: ContactsAddAddressEntryLabels;
  onAddressChange: (address: string, inputMethod: AddAddressInputSource) => void;
  onBack: () => void;
  onClose: () => void;
}>;
