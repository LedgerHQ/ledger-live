import type { ReactNode } from "react";
import type { AddAddressEntryLabels, AddAddressEntryState, AddAddressInputSource } from "./types";

export type ContactsAddAddressEntryProps = Readonly<{
  addressEntry: AddAddressEntryState;
  labels: AddAddressEntryLabels;
  sanctionedAddressBanner?: ReactNode;
  bottomOffset?: number;
  onChangeText: (value: string, inputMethod: AddAddressInputSource) => void;
  onConfirm: () => void;
  onQrCodeClick: () => void;
}>;

export type ContactsAddAddressEntryViewProps = Readonly<{
  value: string;
  labels: AddAddressEntryLabels;
  bottomOffset: number;
  bottomPadding: number;
  inputStatus?: "error" | "success";
  helperText?: string;
  sanctionedAddressBanner?: ReactNode;
  showEnsDisclaimer: boolean;
  isConfirmEnabled: boolean;
  onAddressChange: (value: string) => void;
  onConfirm: () => void;
  onQrCodeClick: () => void;
}>;
