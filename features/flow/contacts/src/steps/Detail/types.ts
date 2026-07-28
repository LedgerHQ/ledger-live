import type { Contact, ContactAddress, ContactAddressId, ContactId } from "@domain/entity-contact";
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

export type PopulatedContactDetailViewModel = Readonly<{
  displayMode: "populated";
  contact: Contact;
  addressCount: number;
  addressRows: readonly ContactDetailAddressRow[];
}>;

export type ContactDetailLabels = Readonly<{
  addAddress: string;
  addYourAddress?: string;
  emptyMeTitle: string;
  emptyContactTitle: (name: string) => string;
  emptyMeDescription: string;
  emptyContactDescription: (name: string) => string;
  ledgerWalletAddresses?: string;
  myAddresses?: string;
  formatAddressCount: (count: number) => string;
}>;

export type ContactDetailViewProps = Readonly<{
  contact: Contact;
  labels: ContactDetailLabels;
  meAvatarSrc: string;
  onAddAddress: () => void;
  onOpenLedgerWalletAddresses?: () => void;
}>;
