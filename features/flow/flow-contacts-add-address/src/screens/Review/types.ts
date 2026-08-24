import type {
  AddAddressDisplayContext,
  ValidAddAddressEntryState,
  ValidAddAddressLabelState,
} from "../../state/types";

export type ContactsAddAddressReviewLabels = Readonly<{
  title: string;
  addressLabel: string;
  currencyLabel: string;
  networkLabel: string;
  nameLabel: string;
  continue: string;
}>;

export type ContactsAddAddressReviewProps = Readonly<{
  addressEntry: ValidAddAddressEntryState;
  addressLabel: ValidAddAddressLabelState;
  displayContext: AddAddressDisplayContext;
  labels: ContactsAddAddressReviewLabels;
  onContinue: () => void;
}>;

export type ContactsAddAddressReviewViewProps = Readonly<{
  address: string;
  currency: string;
  network: string;
  name: string;
  labels: ContactsAddAddressReviewLabels;
  onContinue: () => void;
}>;
