import { selectContactById, type ContactId } from "@domain/entity-contact";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { ContactDetailActionsPorts } from "./model/ports";
import {
  createContactDetailEditIntent,
  isSignerRequiredForContactEdit,
} from "./model/contactActionsViewModel";
import type { ContactDetailActionsViewModel } from "./types";

type ContactsStateRoot = Parameters<typeof selectContactById>[0];

export type UseContactDetailActionsViewModelResult = ContactDetailActionsViewModel;

/**
 * Shared contact detail edit/delete scenario state for Contacts UI.
 * Pass stable `ContactDetailActionsPorts`; a new reference each render recreates the controller.
 */
export function useContactDetailActionsViewModel(
  contactId: ContactId,
  ports: ContactDetailActionsPorts,
): UseContactDetailActionsViewModelResult {
  const contact = useSelector((state: ContactsStateRoot) => selectContactById(state, contactId));
  const editIntent = useMemo(
    () => (contact === undefined ? undefined : createContactDetailEditIntent(contact)),
    [contact],
  );
  const isSignerRequiredForEdit = isSignerRequiredForContactEdit(editIntent);

  return {
    editIntent,
    isSignerRequiredForEdit,
  };
}
