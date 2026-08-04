import type { Contact } from "@domain/entity-contact";
import { useCallback, useMemo, useState } from "react";
import { useContacts } from "../../hooks";
import { createAddContactController } from "./model/controller";
import type { ContactCreationPort } from "./model/ports";
import type { AddContactViewModel } from "./model/types";

export type UseAddContactViewModelResult = AddContactViewModel &
  Readonly<{
    setDraftName: (draftName: string) => void;
    save: () => Promise<Contact>;
  }>;

/**
 * Shared add-contact scenario state for Contacts UI.
 * Pass a stable `ContactCreationPort`; a new reference each render recreates the controller.
 */
export function useAddContactViewModel(
  contactCreation: ContactCreationPort
): UseAddContactViewModelResult {
  const [draftName, setDraftName] = useState("");
  const contacts = useContacts();
  const existingContactNames = useMemo(
    () => contacts.map((contact) => contact.name),
    [contacts]
  );
  const controller = useMemo(
    () => createAddContactController(contactCreation),
    [contactCreation]
  );
  const viewModel = useMemo(
    () => controller.getViewModel(draftName, existingContactNames),
    [controller, draftName, existingContactNames]
  );
  const save = useCallback(
    () => controller.save(draftName, existingContactNames),
    [controller, draftName, existingContactNames]
  );

  return {
    ...viewModel,
    setDraftName,
    save,
  };
}
