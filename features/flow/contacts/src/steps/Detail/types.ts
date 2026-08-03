import type { Contact, ContactAddress, ContactAddressId, ContactId } from "@domain/entity-contact";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { ContactEditRequirement } from "./model/editRequirement";

export type ContactDetailAddressRowIntent = Readonly<{
  type: "open-address-detail";
  contactId: ContactId;
  addressId: ContactAddressId;
}>;

export type ContactDetailEditIntent = Readonly<{
  type: "edit-contact";
  contactId: ContactId;
  editRequirement: ContactEditRequirement;
}>;

export type ContactDetailDeleteIntent = Readonly<{
  type: "delete-contact";
  contactId: ContactId;
}>;

export type ContactDeleteLifecycle =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "open"; contactId: ContactId }>
  | Readonly<{ status: "success"; contactId: ContactId }>
  | Readonly<{ status: "error"; contactId: ContactId }>;

export type ContactDetailActionsViewModel = Readonly<{
  editIntent: ContactDetailEditIntent | undefined;
  deleteIntent: ContactDetailDeleteIntent;
  deleteLifecycle: ContactDeleteLifecycle;
  isSignerRequiredForEdit: boolean;
}>;

export type ContactDetailAddressRow = Readonly<{
  addressId: ContactAddressId;
  label: ContactAddress["label"];
  address: ContactAddress["address"];
  currencyId: ContactAddress["currencyId"];
  intent: ContactDetailAddressRowIntent;
}>;

export type ContactDetailAddressNetworkGroup = Readonly<{
  networkId: CryptoCurrency["id"];
  networkName: string;
  networkTicker: string;
  rows: readonly ContactDetailAddressRow[];
}>;

export type PopulatedContactDetailViewModel = Readonly<{
  displayMode: "populated";
  contact: Contact;
  addressCount: number;
  addressGroups: readonly ContactDetailAddressNetworkGroup[];
}>;

export type ContactDetailLabels = Readonly<{
  addAddress: string;
  addExternalAddress?: string;
  addYourAddress?: string;
  emptyMeTitle: string;
  emptyContactTitle: (name: string) => string;
  emptyMeDescription: string;
  emptyContactDescription: (name: string) => string;
  ledgerWalletAddresses?: string;
  myAddresses?: string;
  formatMeDisplayName?: (name: string) => string;
  formatAddressCount: (count: number) => string;
}>;

export type ContactDetailActionsLabels = Readonly<{
  editContact: string;
  deleteContact: string;
}>;

export type ContactDetailViewProps = Readonly<{
  contact: Contact;
  labels: ContactDetailLabels;
  meAvatarSrc: string;
  onAddAddress: () => void;
  onOpenLedgerWalletAddresses?: () => void;
  addressGroups?: readonly ContactDetailAddressNetworkGroup[];
  onAddressRowPress?: (intent: ContactDetailAddressRowIntent) => void;
  detailActions?: Readonly<{
    canDelete: boolean;
    labels: ContactDetailActionsLabels;
    onEdit: () => void;
    onDelete: () => void;
  }>;
}>;

export type ContactAddressDetailAsset = Readonly<{
  currencyId: ContactAddress["currencyId"];
  name: string;
  ticker: string;
}>;

export type ContactAddressDetailNetwork = Readonly<{
  id: CryptoCurrency["id"];
  name: string;
}>;

export type ContactAddressDetailViewModel =
  | Readonly<{ displayMode: "not-found" }>
  | Readonly<{
      displayMode: "found";
      address: ContactAddress["address"];
      label: ContactAddress["label"];
      network: ContactAddressDetailNetwork;
      asset: ContactAddressDetailAsset;
      qrPayload: string;
    }>;

export type ContactAddressDetailSendIntent = Readonly<{
  type: "send-address";
  contactId: ContactId;
  addressId: ContactAddressId;
  currencyId: ContactAddress["currencyId"];
  address: ContactAddress["address"];
}>;

export type ContactAddressDetailEditIntent = Readonly<{
  type: "edit-address";
  contactId: ContactId;
  addressId: ContactAddressId;
}>;

export type ContactAddressDetailDeleteIntent = Readonly<{
  type: "delete-address";
  contactId: ContactId;
  addressId: ContactAddressId;
}>;

export type ContactAddressDeleteLifecycle =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "open"; contactId: ContactId; addressId: ContactAddressId }>
  | Readonly<{ status: "success"; contactId: ContactId; addressId: ContactAddressId }>
  | Readonly<{ status: "error"; contactId: ContactId; addressId: ContactAddressId }>;

export type ContactAddressDetailActionsViewModel = Readonly<{
  sendIntent: ContactAddressDetailSendIntent | undefined;
  editIntent: ContactAddressDetailEditIntent | undefined;
  deleteIntent: ContactAddressDetailDeleteIntent;
  deleteLifecycle: ContactAddressDeleteLifecycle;
}>;
