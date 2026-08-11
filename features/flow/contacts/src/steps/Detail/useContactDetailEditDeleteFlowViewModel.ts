import { selectContactById, type ContactId } from "@domain/entity-contact";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { ContactDetailActionsPorts } from "./model/ports";
import { useContactDetailActionsViewModel } from "./useContactDetailActionsViewModel";

export type ContactDetailEditUiState = "closed" | "signer-open" | "edit-open";

export type UseContactDetailEditDeleteFlowViewModelOptions = Readonly<{
  contactId: ContactId;
  ports: ContactDetailActionsPorts;
  onDeleteSuccess?: () => void;
}>;

type ContactsStateRoot = Parameters<typeof selectContactById>[0];

export type UseContactDetailEditDeleteFlowViewModelResult = ReturnType<
  typeof useContactDetailActionsViewModel
> &
  Readonly<{
    canDelete: boolean;
    contactName: string;
    editUiState: ContactDetailEditUiState;
    isActionsMenuOpen: boolean;
    isDeleting: boolean;
    onEditPress: () => void;
    onDeletePress: () => void;
    onSignerConfirm: () => void;
    onSignerCancel: () => void;
    onEditClose: () => void;
    onOpenActionsMenu: () => void;
    onCloseActionsMenu: () => void;
  }>;

export function useContactDetailEditDeleteFlowViewModel({
  contactId,
  ports,
  onDeleteSuccess,
}: UseContactDetailEditDeleteFlowViewModelOptions): UseContactDetailEditDeleteFlowViewModelResult {
  const contact = useSelector((state: ContactsStateRoot) => selectContactById(state, contactId));
  const {
    cancelDelete,
    confirmDelete: confirmDeleteAction,
    deleteLifecycle,
    openDelete,
    editIntent,
    deleteIntent,
    isSignerRequiredForEdit,
  } = useContactDetailActionsViewModel(contactId, ports);
  const [editUiState, setEditUiState] = useState<ContactDetailEditUiState>("closed");
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const canDelete = contact !== undefined && !contact.isMe;
  const contactName = contact?.name ?? "";

  const onEditPress = useCallback(() => {
    setIsActionsMenuOpen(false);

    if (isSignerRequiredForEdit) {
      setEditUiState("signer-open");
      return;
    }

    setEditUiState("edit-open");
  }, [isSignerRequiredForEdit]);

  const onDeletePress = useCallback(() => {
    setIsActionsMenuOpen(false);
    openDelete();
  }, [openDelete]);

  const onSignerConfirm = useCallback(() => {
    setEditUiState("edit-open");
  }, []);

  const onSignerCancel = useCallback(() => {
    // QueuedBottomSheet calls onClose when isRequestingToBeOpened becomes false — including
    // after the user confirms and we transition to edit-open. Only cancel when still on signer.
    setEditUiState(current => (current === "signer-open" ? "closed" : current));
  }, []);

  const onEditClose = useCallback(() => {
    setEditUiState("closed");
  }, []);

  const onOpenActionsMenu = useCallback(() => {
    setIsActionsMenuOpen(true);
  }, []);

  const onCloseActionsMenu = useCallback(() => {
    setIsActionsMenuOpen(false);
  }, []);

  const confirmDelete = useCallback(async () => {
    setIsDeleting(true);

    try {
      await confirmDeleteAction();
    } finally {
      setIsDeleting(false);
    }
  }, [confirmDeleteAction]);

  useEffect(() => {
    if (deleteLifecycle.status !== "success") {
      return;
    }

    onDeleteSuccess?.();
    cancelDelete();
  }, [cancelDelete, deleteLifecycle.status, onDeleteSuccess]);

  return {
    editIntent,
    deleteIntent,
    deleteLifecycle,
    isSignerRequiredForEdit,
    openDelete,
    cancelDelete,
    confirmDelete,
    canDelete,
    contactName,
    editUiState,
    isActionsMenuOpen,
    isDeleting,
    onEditPress,
    onDeletePress,
    onSignerConfirm,
    onSignerCancel,
    onEditClose,
    onOpenActionsMenu,
    onCloseActionsMenu,
  };
}
