import type {
  AddAddressEntryLabels,
  AddAddressEntryState,
  AddAddressInputSource,
} from "../Flow/types";

export type ContactsAddAddressEntryProps = Readonly<{
  addressEntry: AddAddressEntryState;
  labels: AddAddressEntryLabels;
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
  showEnsDisclaimer: boolean;
  isConfirmEnabled: boolean;
  onAddressChange: (value: string) => void;
  onConfirm: () => void;
  onQrCodeClick: () => void;
}>;
