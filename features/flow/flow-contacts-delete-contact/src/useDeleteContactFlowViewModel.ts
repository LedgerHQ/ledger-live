import { selectContactById, type ContactId } from "@domain/entity-contact";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { createContactDeleteController } from "./model/contactDeleteController";
import type { ContactDeletionPort } from "./model/ports";
import {
  createContactDeleteIntent,
  createIdleContactDeleteLifecycle,
  createOpenContactDeleteLifecycle,
} from "./model/contactDeleteViewModel";
import type { ContactDeleteLifecycle } from "./types";

type ContactsStateRoot = Parameters<typeof selectContactById>[0];

export type UseDeleteContactFlowViewModelOptions = Readonly<{
  contactId: ContactId;
  deletionPort: ContactDeletionPort;
  onSuccess?: () => void;
}>;

export function useDeleteContactFlowViewModel({
  contactId,
  deletionPort,
  onSuccess,
}: UseDeleteContactFlowViewModelOptions) {
  const contact = useSelector((state: ContactsStateRoot) => selectContactById(state, contactId));
  const controller = useMemo(() => createContactDeleteController(deletionPort), [deletionPort]);
  const [lifecycle, setLifecycle] = useState<ContactDeleteLifecycle>(
    createIdleContactDeleteLifecycle,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const canDelete = contact !== undefined && !contact.isMe;

  const openDelete = useCallback(() => {
    if (canDelete) {
      setLifecycle(createOpenContactDeleteLifecycle(contactId));
    }
  }, [canDelete, contactId]);
  const cancelDelete = useCallback(() => setLifecycle(createIdleContactDeleteLifecycle()), []);
  const confirmDelete = useCallback(async () => {
    if (!canDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      setLifecycle(await controller.confirmDelete(contactId));
    } finally {
      setIsDeleting(false);
    }
  }, [canDelete, contactId, controller]);

  useEffect(() => {
    if (lifecycle.status === "success") {
      onSuccess?.();
      cancelDelete();
    }
  }, [cancelDelete, lifecycle.status, onSuccess]);

  return {
    canDelete,
    deleteIntent: createContactDeleteIntent(contactId),
    deleteLifecycle: lifecycle,
    isDeleting,
    openDelete,
    cancelDelete,
    confirmDelete,
  };
}
