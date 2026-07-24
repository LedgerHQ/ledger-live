import type { Contact } from "@domain/entity-contact";

export type ContactDetailLabels = Readonly<{
  addAddress: string;
  emptyStateTitle: string;
  emptyMeDescription: string;
  formatEmptyContactDescription: (name: string) => string;
  formatAddressCount: (count: number) => string;
}>;

export type ContactDetailViewProps = Readonly<{
  contact: Contact;
  labels: ContactDetailLabels;
  meAvatarSrc: string;
  onAddAddress: () => void;
}>;
