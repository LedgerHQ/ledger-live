import { parseContactName, type Contact } from "@domain/entity-contact";
import type { ContactEditPort } from "../../Detail/model/ports";
import { createRenameContactViewModel } from "./viewModel";
import type { RenameContactViewModel } from "../types";

export type RenameContactController = Readonly<{
  getViewModel: (draftName: string, currentName: string) => RenameContactViewModel;
  save: (contactId: Contact["id"], draftName: string) => Promise<Contact>;
}>;

export function createRenameContactController(editPort: ContactEditPort): RenameContactController {
  return {
    getViewModel: createRenameContactViewModel,
    save: async (contactId, draftName) => {
      const name = parseContactName(draftName);

      return editPort.renameContact({ contactId, name });
    },
  };
}
