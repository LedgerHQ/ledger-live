import type { AddAddressFlowState, AddAddressInputSource } from "@features/flow-contacts";
import type { ContactAddress } from "@domain/entity-contact";

export type ContactsAddAddressFlowDrawerProps = Readonly<{
  state: AddAddressFlowState;
  eligibleNetworkIds: readonly string[];
  onAddressChange: (value: string, inputMethod: AddAddressInputSource) => void;
  onAddressConfirm: () => void;
  onBack: () => void;
  onClose: () => void;
  onContinueFromName: () => void;
  onContinueFromReview: () => void;
  onCurrencySelected: (currencyId: ContactAddress["currencyId"]) => void;
  onQrCodeClick: () => void;
}>;

export type ContactsAddAddressDrawerStep = "currency" | "address" | "name" | "review" | "success";
