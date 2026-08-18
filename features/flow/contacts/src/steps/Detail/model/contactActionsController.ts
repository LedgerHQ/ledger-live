import type { ContactId } from "@domain/entity-contact";
import type { ContactDetailActionsPorts } from "./ports";
import {
  createErrorContactDeleteLifecycle,
  createSuccessContactDeleteLifecycle,
} from "./contactActionsViewModel";
import type { ContactDeleteLifecycle } from "../types";

export type ContactDetailActionsController = Readonly<{
  confirmDelete: (contactId: ContactId) => Promise<ContactDeleteLifecycle>;
}>;

export function createContactDetailActionsController(
  ports: ContactDetailActionsPorts,
): ContactDetailActionsController {
  return {
    confirmDelete: async contactId => {
      try {
        await ports.deletion.deleteContact(contactId);

        return createSuccessContactDeleteLifecycle(contactId);
      } catch {
        return createErrorContactDeleteLifecycle(contactId);
      }
    },
  };
}
