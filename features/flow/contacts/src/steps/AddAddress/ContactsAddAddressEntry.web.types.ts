import type { ChangeEvent, ClipboardEvent } from "react";
import type { AddAddressEntryLabels, AddAddressEntryState, AddAddressInputSource } from "./types";

export type ContactsAddAddressEntryWebProps = Readonly<{
  addressEntry: AddAddressEntryState;
  labels: AddAddressEntryLabels;
  onAddressChange: (address: string, inputMethod: AddAddressInputSource) => void;
  onConfirm?: () => void;
}>;

export type ContactsAddAddressEntryWebViewProps = Readonly<{
  value: string;
  labels: AddAddressEntryLabels;
  inputStatus?: "error" | "success";
  helperText?: string;
  showEnsDisclaimer: boolean;
  isConfirmEnabled: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPaste: (event: ClipboardEvent<HTMLInputElement>) => void;
  onConfirm?: () => void;
}>;
