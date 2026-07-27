import type {
  Contact,
  ContactAddress,
  ContactAddressId,
  ContactId,
} from "@domain/entity-contact";

export type ContactDetailAddressRowIntent = Readonly<{
  type: "open-address-detail";
  contactId: ContactId;
  addressId: ContactAddressId;
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
  emptyMeTitle: string;
  emptyContactTitle: (name: string) => string;
  emptyMeDescription: string;
  emptyContactDescription: (name: string) => string;
  formatAddressCount: (count: number) => string;
}>;

export type ContactDetailViewProps = Readonly<{
  contact: Contact;
  labels: ContactDetailLabels;
  meAvatarSrc: string;
  onAddAddress: () => void;
}>;
