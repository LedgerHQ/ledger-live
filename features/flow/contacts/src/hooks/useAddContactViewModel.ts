import type { Contact } from "@domain/entity-contact";
import { useCallback, useMemo, useState } from "react";
import { createAddContactController } from "../add/controller";
import type { ContactCreationPort } from "../add/ports";
import type { AddContactViewModel } from "../add/types";

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
  contactCreation: ContactCreationPort,
): UseAddContactViewModelResult {
  const [draftName, setDraftName] = useState("");
  const controller = useMemo(
    () => createAddContactController(contactCreation),
    [contactCreation],
  );
  const viewModel = useMemo(
    () => controller.getViewModel(draftName),
    [controller, draftName],
  );
  const save = useCallback(() => controller.save(draftName), [controller, draftName]);

  return {
    ...viewModel,
    setDraftName,
    save,
  };
}
