import type {
  AddAddressCompletionLabels,
  AddAddressFlowState,
  AddAddressInputSource,
  ContactsAddAddressEntryLabels,
  ContactsAddAddressNameLabels,
  SanctionedAddressBannerProps,
} from "@features/flow-contacts";

export type ContactsAddAddressReviewLabels = AddAddressCompletionLabels;

export type ContactsAddAddressFlowDialogProps = Readonly<{
  state: AddAddressFlowState;
  entryLabels: ContactsAddAddressEntryLabels;
  sanctionedAddressBanner: SanctionedAddressBannerProps;
  nameLabels: ContactsAddAddressNameLabels;
  reviewLabels: ContactsAddAddressReviewLabels;
  onAddressChange: (address: string, inputMethod: AddAddressInputSource) => void;
  onContinueFromAddressDetails: () => void;
  onAddressLabelChange: (value: string) => void;
  onContinueFromName: () => void;
  onContinueFromReview: () => void;
  onCompleteMockConfirmation: () => void;
  onBack: () => void;
  onClose: () => void;
}>;
