import type { ContactAddressId, ContactId } from "@domain/entity-contact";
import type { ContactAddressDetailActionsPorts } from "./ports";
import {
  createErrorContactAddressDeleteLifecycle,
  createSuccessContactAddressDeleteLifecycle,
} from "./addressDetailActionsViewModel";
import type { ContactAddressDeleteLifecycle } from "../types";

export type ContactAddressDetailActionsController = Readonly<{
  confirmDelete: (
    contactId: ContactId,
    addressId: ContactAddressId,
  ) => Promise<ContactAddressDeleteLifecycle>;
}>;

export function createContactAddressDetailActionsController(
  ports: ContactAddressDetailActionsPorts,
): ContactAddressDetailActionsController {
  return {
    confirmDelete: async (contactId, addressId) => {
      try {
        await ports.deletion.deleteAddress({ contactId, addressId });

        return createSuccessContactAddressDeleteLifecycle(contactId, addressId);
      } catch {
        return createErrorContactAddressDeleteLifecycle(contactId, addressId);
      }
    },
  };
}
