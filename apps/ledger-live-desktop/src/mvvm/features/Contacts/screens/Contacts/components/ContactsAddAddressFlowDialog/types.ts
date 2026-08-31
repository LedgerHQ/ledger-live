import type {
  AddAddressEntryLabels,
  AddAddressFlowState,
  AddAddressInputSource,
  ContactsAddAddressNameLabels,
  ContactsAddAddressReviewLabels,
  SanctionedAddressBannerProps,
} from "@features/flow-contacts-add-address";

export type ContactsAddAddressFlowDialogProps = Readonly<{
  state: AddAddressFlowState;
  entryLabels: AddAddressEntryLabels;
  sanctionedAddressBanner: SanctionedAddressBannerProps;
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
