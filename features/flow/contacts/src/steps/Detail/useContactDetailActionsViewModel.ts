import { selectContactById, type ContactId } from "@domain/entity-contact";
import { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { createContactDetailActionsController } from "./model/contactActionsController";
import type { ContactDetailActionsPorts } from "./model/ports";
import {
  createContactDetailDeleteIntent,
  createContactDetailEditIntent,
  createIdleContactDeleteLifecycle,
  createOpenContactDeleteLifecycle,
  isSignerRequiredForContactEdit,
} from "./model/contactActionsViewModel";
import type { ContactDeleteLifecycle, ContactDetailActionsViewModel } from "./types";

type ContactsStateRoot = Parameters<typeof selectContactById>[0];

export type UseContactDetailActionsViewModelResult = ContactDetailActionsViewModel &
  Readonly<{
    openDelete: () => void;
    cancelDelete: () => void;
    confirmDelete: () => Promise<void>;
  }>;

/**
 * Shared contact detail edit/delete scenario state for Contacts UI.
 * Pass stable `ContactDetailActionsPorts`; a new reference each render recreates the controller.
 */
export function useContactDetailActionsViewModel(
  contactId: ContactId,
  ports: ContactDetailActionsPorts,
): UseContactDetailActionsViewModelResult {
  const contact = useSelector((state: ContactsStateRoot) => selectContactById(state, contactId));
  const controller = useMemo(() => createContactDetailActionsController(ports), [ports]);
  const [deleteLifecycle, setDeleteLifecycle] = useState<ContactDeleteLifecycle>(() =>
    createIdleContactDeleteLifecycle(),
  );

  const editIntent = useMemo(
    () => (contact === undefined ? undefined : createContactDetailEditIntent(contact)),
    [contact],
  );
  const deleteIntent = useMemo(() => createContactDetailDeleteIntent(contactId), [contactId]);
  const isSignerRequiredForEdit = isSignerRequiredForContactEdit(editIntent);

  const openDelete = useCallback(() => {
    setDeleteLifecycle(createOpenContactDeleteLifecycle(contactId));
  }, [contactId]);

  const cancelDelete = useCallback(() => {
    setDeleteLifecycle(createIdleContactDeleteLifecycle());
  }, []);

  const confirmDelete = useCallback(async () => {
    setDeleteLifecycle(await controller.confirmDelete(contactId));
  }, [controller, contactId]);

  return {
    editIntent,
    deleteIntent,
    deleteLifecycle,
    isSignerRequiredForEdit,
    openDelete,
    cancelDelete,
    confirmDelete,
  };
}
