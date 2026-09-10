import type {
  AddAddressFlowState,
  AddAddressInputSource,
  SanctionedAddressBannerProps,
} from "@features/flow-contacts-add-address";

export type ContactsAddAddressFlowDialogProps = Readonly<{
  state: AddAddressFlowState;
  sanctionedAddressBanner: SanctionedAddressBannerProps;
  onAddressChange: (address: string, inputMethod: AddAddressInputSource) => void;
  onContinueFromAddressDetails: () => void;
  onAddressLabelChange: (value: string) => void;
  onContinueFromName: () => void;
  onContinueFromReview: () => void;
  onBack: () => void;
  onClose: () => void;
}>;
