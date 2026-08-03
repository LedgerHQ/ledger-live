import type { AddAddressLabelState, AddAddressNameLabels } from "./types";

export type ContactsAddAddressNameProps = Readonly<{
  addressLabel: AddAddressLabelState;
  labels: AddAddressNameLabels;
  bottomOffset?: number;
  onChangeText: (value: string) => void;
  onContinue: () => void;
}>;
