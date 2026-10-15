import type { ContactAddressId, ContactId } from "@domain/entity-contact";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createContactAddressDeleteController } from "./model/addressDeleteController";
import type { ContactAddressDeletionPort } from "./model/ports";
import {
  createContactAddressDeleteIntent,
  createIdleContactAddressDeleteLifecycle,
  createOpenContactAddressDeleteLifecycle,
} from "./model/addressDeleteViewModel";
import type { ContactAddressDeleteLifecycle } from "./types";

export type UseDeleteAddressFlowViewModelOptions = Readonly<{
  contactId: ContactId;
  addressId: ContactAddressId | undefined;
  deletionPort: ContactAddressDeletionPort;
  onSuccess?: () => void;
}>;

export function useDeleteAddressFlowViewModel({
  contactId,
  addressId,
  deletionPort,
  onSuccess,
}: UseDeleteAddressFlowViewModelOptions) {
  const controller = useMemo(
    () => createContactAddressDeleteController(deletionPort),
    [deletionPort],
  );
  const [lifecycle, setLifecycle] = useState<ContactAddressDeleteLifecycle>(
    createIdleContactAddressDeleteLifecycle,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const canDelete = addressId !== undefined;

  const openDelete = useCallback(() => {
    if (addressId !== undefined) {
      setLifecycle(createOpenContactAddressDeleteLifecycle(contactId, addressId));
    }
  }, [addressId, contactId]);
  const cancelDelete = useCallback(
    () => setLifecycle(createIdleContactAddressDeleteLifecycle()),
    [],
  );
  const confirmDelete = useCallback(async () => {
    if (addressId === undefined) {
      return;
    }

    setIsDeleting(true);
    try {
      setLifecycle(await controller.confirmDelete(contactId, addressId));
    } finally {
      setIsDeleting(false);
    }
  }, [addressId, contactId, controller]);

  useEffect(() => {
    if (lifecycle.status === "success") {
      onSuccess?.();
      cancelDelete();
    }
  }, [cancelDelete, lifecycle.status, onSuccess]);

  return {
    canDelete,
    deleteIntent:
      addressId === undefined ? undefined : createContactAddressDeleteIntent(contactId, addressId),
    deleteLifecycle: lifecycle,
    isDeleting,
    openDelete,
    cancelDelete,
    confirmDelete,
  };
}
