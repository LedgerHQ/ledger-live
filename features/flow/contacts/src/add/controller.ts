import { ContactNameSchema, type Contact } from "@domain/entity-contact";
import type { ContactCreationPort } from "./ports";
import { createAddContactViewModel } from "./viewModel";
import type { AddContactViewModel } from "./types";

export type AddContactController = Readonly<{
  getViewModel: (draftName: string) => AddContactViewModel;
  save: (draftName: string) => Promise<Contact>;
}>;

export function createAddContactController(
  contactCreation: ContactCreationPort,
): AddContactController {
  return {
    getViewModel: draftName => createAddContactViewModel(draftName),
    save: async draftName => {
      const parsedName = ContactNameSchema.parse(draftName.trim());

      return contactCreation.createContact({ name: parsedName });
    },
  };
}
