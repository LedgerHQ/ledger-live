import type { Contact } from "@domain/entity-contact";

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
