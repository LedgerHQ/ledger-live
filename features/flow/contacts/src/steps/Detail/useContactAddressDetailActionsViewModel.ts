import {
  selectContactAddressById,
  type ContactAddressId,
  type ContactId,
} from "@domain/entity-contact";
import { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { createContactAddressDetailActionsController } from "./model/addressDetailActionsController";
import type { ContactAddressDetailActionsPorts } from "./model/ports";
import {
  createContactAddressDetailDeleteIntent,
  createContactAddressDetailEditIntent,
  createContactAddressDetailSendIntent,
  createIdleContactAddressDeleteLifecycle,
  createOpenContactAddressDeleteLifecycle,
} from "./model/addressDetailActionsViewModel";
import type {
  ContactAddressDeleteLifecycle,
  ContactAddressDetailActionsViewModel,
} from "./types";

type ContactsStateRoot = Parameters<typeof selectContactAddressById>[0];

export type UseContactAddressDetailActionsViewModelResult = ContactAddressDetailActionsViewModel &
  Readonly<{
    openDelete: () => void;
    cancelDelete: () => void;
    confirmDelete: () => Promise<void>;
  }>;

/**
 * Shared address detail quick-action scenario state for Contacts UI.
 * Pass stable `ContactAddressDetailActionsPorts`; a new reference each render recreates the controller.
 */
export function useContactAddressDetailActionsViewModel(
  contactId: ContactId,
  addressId: ContactAddressId,
  ports: ContactAddressDetailActionsPorts,
): UseContactAddressDetailActionsViewModelResult {
  const contactAddress = useSelector((state: ContactsStateRoot) =>
    selectContactAddressById(state, contactId, addressId),
  );
  const controller = useMemo(() => createContactAddressDetailActionsController(ports), [ports]);
  const [deleteLifecycle, setDeleteLifecycle] = useState<ContactAddressDeleteLifecycle>(() =>
    createIdleContactAddressDeleteLifecycle(),
  );

  const sendIntent = useMemo(
    () =>
      contactAddress === undefined
        ? undefined
        : createContactAddressDetailSendIntent(contactId, contactAddress),
    [contactAddress, contactId],
  );
  const editIntent = useMemo(
    () =>
      contactAddress === undefined
        ? undefined
        : createContactAddressDetailEditIntent(contactId, contactAddress),
    [contactAddress, contactId],
  );
  const deleteIntent = useMemo(
    () => createContactAddressDetailDeleteIntent(contactId, addressId),
    [contactId, addressId],
  );

  const openDelete = useCallback(() => {
    setDeleteLifecycle(createOpenContactAddressDeleteLifecycle(contactId, addressId));
  }, [addressId, contactId]);

  const cancelDelete = useCallback(() => {
    setDeleteLifecycle(createIdleContactAddressDeleteLifecycle());
  }, []);

  const confirmDelete = useCallback(async () => {
    setDeleteLifecycle(await controller.confirmDelete(contactId, addressId));
  }, [addressId, contactId, controller]);

  return {
    sendIntent,
    editIntent,
    deleteIntent,
    deleteLifecycle,
    openDelete,
    cancelDelete,
    confirmDelete,
  };
}
