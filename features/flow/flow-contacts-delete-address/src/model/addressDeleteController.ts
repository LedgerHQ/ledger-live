import type { ContactAddressId, ContactId } from "@domain/entity-contact";
import type { ContactAddressDeletionPort } from "./ports";
import {
  createErrorContactAddressDeleteLifecycle,
  createSuccessContactAddressDeleteLifecycle,
} from "./addressDeleteViewModel";
import type { ContactAddressDeleteLifecycle } from "../types";

export type ContactAddressDeleteController = Readonly<{
  confirmDelete: (
    contactId: ContactId,
    addressId: ContactAddressId,
  ) => Promise<ContactAddressDeleteLifecycle>;
}>;

export function createContactAddressDeleteController(
  ports: ContactAddressDeletionPort,
): ContactAddressDeleteController {
  return {
    confirmDelete: async (contactId, addressId) => {
      try {
        await ports.deleteAddress({ contactId, addressId });

        return createSuccessContactAddressDeleteLifecycle(contactId, addressId);
      } catch {
        return createErrorContactAddressDeleteLifecycle(contactId, addressId);
      }
    },
  };
}
