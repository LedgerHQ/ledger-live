import type { ContactId } from "@domain/entity-contact";
import type { ContactDeletionPort } from "./ports";
import {
  createErrorContactDeleteLifecycle,
  createSuccessContactDeleteLifecycle,
} from "./contactDeleteViewModel";
import type { ContactDeleteLifecycle } from "../types";

export type ContactDeleteController = Readonly<{
  confirmDelete: (contactId: ContactId) => Promise<ContactDeleteLifecycle>;
}>;

export function createContactDeleteController(ports: ContactDeletionPort): ContactDeleteController {
  return {
    confirmDelete: async contactId => {
      try {
        await ports.deleteContact(contactId);

        return createSuccessContactDeleteLifecycle(contactId);
      } catch {
        return createErrorContactDeleteLifecycle(contactId);
      }
    },
  };
}
