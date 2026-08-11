import { parseContactAddressLabel } from "@domain/entity-contact";
import type { ContactAddressEditPort } from "../../Detail/model/ports";
import { createRenameAddressViewModel } from "./viewModel";
import type { RenameAddressController } from "../types";

export function createRenameAddressController(
  editPort: ContactAddressEditPort,
): RenameAddressController {
  return {
    getViewModel: createRenameAddressViewModel,
    save: async (contactId, addressId, draftLabel, existingLabels) => {
      const label = parseContactAddressLabel(draftLabel, existingLabels);

      return editPort.renameAddressLabel({ contactId, addressId, label });
    },
  };
}
