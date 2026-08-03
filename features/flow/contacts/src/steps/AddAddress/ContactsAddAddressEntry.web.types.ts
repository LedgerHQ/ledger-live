import type { ChangeEvent, ClipboardEvent } from "react";
import type { ContactsAddAddressNameLabels } from "./AddressName/types";
import type {
  AddAddressEntryLabels,
  AddAddressEntryState,
  AddAddressInputSource,
  AddAddressLabelState,
} from "./types";

export type ContactsAddAddressEntryWebProps = Readonly<{
  addressEntry: AddAddressEntryState;
  labels: AddAddressEntryLabels;
  onAddressChange: (address: string, inputMethod: AddAddressInputSource) => void;
  addressLabel?: AddAddressLabelState;
  nameLabels?: ContactsAddAddressNameLabels;
  onAddressLabelChange?: (value: string) => void;
  onConfirm?: () => void;
}>;

export type ContactsAddAddressEntryWebViewProps = Readonly<{
  value: string;
  labels: AddAddressEntryLabels;
  inputStatus?: "error" | "success";
  helperText?: string;
  showEnsDisclaimer: boolean;
  addressLabel?: AddAddressLabelState;
  nameLabels?: ContactsAddAddressNameLabels;
  nameValidationMessage?: string;
  isConfirmEnabled: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPaste: (event: ClipboardEvent<HTMLInputElement>) => void;
  onAddressLabelChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onConfirm?: () => void;
}>;
