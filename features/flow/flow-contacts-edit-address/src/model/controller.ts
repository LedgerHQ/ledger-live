import { ContactError, parseContactAddressLabel } from "@domain/entity-contact";
import type { ContactAddressEditPort } from "@features/platform-contacts";
import { createRenameAddressViewModel } from "./viewModel";
import type { RenameAddressController } from "../types";

export function createRenameAddressController(
  editPort: ContactAddressEditPort,
): RenameAddressController {
  return {
    getViewModel: createRenameAddressViewModel,
    save: async (contactId, addressId, draftLabel, addressEntry, existingLabels) => {
      if (addressEntry.status !== "valid") {
        throw new ContactError("Cannot save an address that has not been validated");
      }

      const label = parseContactAddressLabel(draftLabel, existingLabels);

      return editPort.updateAddress({
        contactId,
        addressId,
        label,
        address: addressEntry.resolvedAddress,
      });
    },
  };
}
