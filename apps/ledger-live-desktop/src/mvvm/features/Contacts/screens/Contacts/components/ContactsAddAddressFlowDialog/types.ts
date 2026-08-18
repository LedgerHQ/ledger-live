import type {
  AddAddressCompletionLabels,
  AddAddressFlowState,
  AddAddressInputSource,
  ContactsAddAddressEntryLabels,
  ContactsAddAddressNameLabels,
  ContactsAddAddressReviewLabels,
  SanctionedAddressBannerProps,
} from "@features/flow-contacts";

export type ContactsAddAddressFlowDialogProps = Readonly<{
  state: AddAddressFlowState;
  entryLabels: ContactsAddAddressEntryLabels;
  sanctionedAddressBanner: SanctionedAddressBannerProps;
  nameLabels: ContactsAddAddressNameLabels;
  reviewLabels: ContactsAddAddressReviewLabels;
  completionLabels: AddAddressCompletionLabels;
  onAddressChange: (address: string, inputMethod: AddAddressInputSource) => void;
  onContinueFromAddressDetails: () => void;
  onAddressLabelChange: (value: string) => void;
  onContinueFromName: () => void;
  onContinueFromReview: () => void;
  onCompleteMockConfirmation: () => void;
  onBack: () => void;
  onClose: () => void;
}>;
