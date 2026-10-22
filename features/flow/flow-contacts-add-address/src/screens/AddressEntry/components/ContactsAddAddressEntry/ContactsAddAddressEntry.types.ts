import type { SanctionedAddressBannerProps } from "../../../../components/SanctionedAddressBanner/types";
import type { AddAddressEntryLabels } from "../../../../copy/addAddressEntryLabels";
import type { AddAddressEntryState, AddAddressInputSource } from "../../../../state/types";

export type { SanctionedAddressBannerProps } from "../../../../components/SanctionedAddressBanner/types";

export type ContactsAddAddressEntryProps = Readonly<{
  addressEntry: AddAddressEntryState;
  supportsDomain: boolean;
  onSanctionedAddressLearnMore?: () => void;
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
  sanctionedAddressBanner?: SanctionedAddressBannerProps;
  showEnsDisclaimer: boolean;
  isConfirmEnabled: boolean;
  onAddressChange: (value: string) => void;
  onConfirm: () => void;
  onQrCodeClick: () => void;
}>;
