import type { ContactId } from "@domain/entity-contact";

export type ContactDeletionPort = Readonly<{
  deleteContact(contactId: ContactId): Promise<void>;
}>;
