import {
  parseContactName,
  type Contact,
  type ContactName,
} from "@domain/entity-contact";
import type { ContactCreationPort } from "./ports";
import { createAddContactViewModel } from "./viewModel";
import type { AddContactViewModel } from "./types";

export type AddContactController = Readonly<{
  getViewModel: (
    draftName: string,
    existingNames?: readonly ContactName[]
  ) => AddContactViewModel;
  save: (
    draftName: string,
    existingNames?: readonly ContactName[]
  ) => Promise<Contact>;
}>;

export function createAddContactController(
  contactCreation: ContactCreationPort
): AddContactController {
  return {
    getViewModel: (draftName, existingNames = []) =>
      createAddContactViewModel(draftName, existingNames),
    save: async (draftName, existingNames = []) => {
      const name = parseContactName(draftName, existingNames);

      return contactCreation.createContact({ name });
    },
  };
}
