import {
  CONTACT_SIGNER_MISMATCH_ERROR,
  resolveContactSignerValidationResult,
  selectContactById,
  type ContactId,
} from "@domain/entity-contact";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { ContactDetailActionsPorts } from "../model/ports";
import { useContactDetailActionsViewModel } from "../useContactDetailActionsViewModel";
import { useContactEditSignerUiState } from "../useContactEditSignerUiState";
import type { SignerEditUiState } from "../model/signerEditUiState";

export type ContactDetailEditUiState = SignerEditUiState;

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
    onSignerConfirm: () => Promise<void>;
    onSignerCancel: () => void;
    onSignerMismatchCancel: () => void;
    onConnectDifferentDevice: () => void;
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
  const {
    editUiState,
    openSignerDialog,
    openSignerMismatchDialog,
    openEditDialog,
    onSignerCancel: closeSignerOnCancel,
    onSignerMismatchCancel,
    onConnectDifferentDevice,
    onEditClose: closeEditUiState,
  } = useContactEditSignerUiState();
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const canDelete = contact !== undefined && !contact.isMe;
  const contactName = contact?.name ?? "";

  const onEditPress = useCallback(() => {
    setIsActionsMenuOpen(false);

    if (isSignerRequiredForEdit) {
      openSignerDialog();
      return;
    }

    openEditDialog();
  }, [isSignerRequiredForEdit, openEditDialog, openSignerDialog]);

  const onSignerConfirm = useCallback(async () => {
    const validationLookup = editIntent?.signerValidationLookup;

    if (validationLookup === undefined) {
      openEditDialog();
      return;
    }

    const [expectedSignerId, currentSignerId] = await Promise.all([
      ports.signerValidation.getExpectedSignerId(validationLookup),
      ports.signerValidation.getCurrentSignerId(),
    ]);
    const status = resolveContactSignerValidationResult(expectedSignerId, currentSignerId);

    if (status === CONTACT_SIGNER_MISMATCH_ERROR) {
      openSignerMismatchDialog();
      return;
    }

    openEditDialog();
  }, [
    editIntent?.signerValidationLookup,
    openEditDialog,
    openSignerMismatchDialog,
    ports.signerValidation,
  ]);

  const onSignerCancel = useCallback(() => {
    closeSignerOnCancel();
  }, [closeSignerOnCancel]);

  const onEditClose = useCallback(() => {
    closeEditUiState();
  }, [closeEditUiState]);

  const onDeletePress = useCallback(() => {
    setIsActionsMenuOpen(false);
    openDelete();
  }, [openDelete]);

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
    onSignerMismatchCancel,
    onConnectDifferentDevice,
    onEditClose,
    onOpenActionsMenu,
    onCloseActionsMenu,
  };
}
