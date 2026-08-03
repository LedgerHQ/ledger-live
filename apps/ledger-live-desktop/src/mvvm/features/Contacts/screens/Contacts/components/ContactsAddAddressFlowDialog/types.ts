import type {
  AddAddressCompletionLabels,
  AddAddressFlowState,
  AddAddressInputSource,
  ContactsAddAddressEntryLabels,
  ContactsAddAddressNameLabels,
} from "@features/flow-contacts";

export type ContactsAddAddressReviewLabels = AddAddressCompletionLabels;

export type ContactsAddAddressFlowDialogProps = Readonly<{
  state: AddAddressFlowState;
  entryLabels: ContactsAddAddressEntryLabels;
  nameLabels: ContactsAddAddressNameLabels;
  reviewLabels: ContactsAddAddressReviewLabels;
  onAddressChange: (address: string, inputMethod: AddAddressInputSource) => void;
  onContinueFromAddressDetails: () => void;
  onAddressLabelChange: (value: string) => void;
  onContinueFromName: () => void;
  onContinueFromReview: () => void;
  onBack: () => void;
  onClose: () => void;
}>;
