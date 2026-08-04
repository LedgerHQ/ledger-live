import type { ChangeEvent, ClipboardEvent } from "react";
import type { ContactsAddAddressNameLabels } from "./AddressName/types";
import type { SanctionedAddressBannerProps } from "@features/platform-address-validation";
import type {
  AddAddressEntryLabels,
  AddAddressEntryState,
  AddAddressInputSource,
  AddAddressLabelState,
} from "./types";

export type AddressLabelConfiguration = Readonly<{
  addressLabel: AddAddressLabelState;
  nameLabels: ContactsAddAddressNameLabels;
  onAddressLabelChange: (value: string) => void;
}>;

type WithoutAddressLabelConfiguration = Readonly<{
  addressLabel?: never;
  nameLabels?: never;
  onAddressLabelChange?: never;
}>;

type AddressLabelViewConfiguration = Readonly<{
  addressLabel: AddAddressLabelState;
  nameLabels: ContactsAddAddressNameLabels;
  nameValidationMessage?: string;
  onAddressLabelChange: (event: ChangeEvent<HTMLInputElement>) => void;
}>;

type WithoutAddressLabelViewConfiguration = Readonly<{
  addressLabel?: never;
  nameLabels?: never;
  nameValidationMessage?: never;
  onAddressLabelChange?: never;
}>;

type ContactsAddAddressEntryWebBaseProps = Readonly<{
  addressEntry: AddAddressEntryState;
  labels: AddAddressEntryLabels;
  sanctionedBanner?: SanctionedAddressBannerProps;
  onAddressChange: (address: string, inputMethod: AddAddressInputSource) => void;
  onConfirm?: () => void;
}>;

export type ContactsAddAddressEntryWebProps =
  | (ContactsAddAddressEntryWebBaseProps & AddressLabelConfiguration)
  | (ContactsAddAddressEntryWebBaseProps & WithoutAddressLabelConfiguration);

type ContactsAddAddressEntryWebViewBaseProps = Readonly<{
  value: string;
  labels: AddAddressEntryLabels;
  inputStatus?: "error" | "success";
  helperText?: string;
  sanctionedBanner?: SanctionedAddressBannerProps;
  showEnsDisclaimer: boolean;
  isConfirmEnabled: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPaste: (event: ClipboardEvent<HTMLInputElement>) => void;
  onConfirm?: () => void;
}>;

export type ContactsAddAddressEntryWebViewProps =
  | (ContactsAddAddressEntryWebViewBaseProps & AddressLabelViewConfiguration)
  | (ContactsAddAddressEntryWebViewBaseProps & WithoutAddressLabelViewConfiguration);
