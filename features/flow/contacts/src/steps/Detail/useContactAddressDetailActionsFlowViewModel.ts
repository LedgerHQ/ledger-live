import {
  CONTACT_SIGNER_MISMATCH_ERROR,
  resolveContactSignerValidationResult,
  type ContactAddressId,
  type ContactId,
} from "@domain/entity-contact";
import { ContactAddressIdSchema } from "@domain/entity-contact";
import { useCallback, useEffect, useState } from "react";
import type { ContactAddressDetailActionsPorts } from "./model/ports";
import type { ContactAddressDetailSendIntent } from "./types";
import { useContactAddressDetailActionsViewModel } from "./useContactAddressDetailActionsViewModel";
import { useContactEditSignerUiState } from "./useContactEditSignerUiState";

const PLACEHOLDER_ADDRESS_ID = ContactAddressIdSchema.parse("address-unselected");

export type UseContactAddressDetailActionsFlowViewModelOptions = Readonly<{
  contactId: ContactId;
  addressId: ContactAddressId | undefined;
  ports: ContactAddressDetailActionsPorts;
  onSend?: (intent: ContactAddressDetailSendIntent) => void;
  onDeleteSuccess?: () => void;
  onCloseAddressDetail?: () => void;
}>;

export type UseContactAddressDetailActionsFlowViewModelResult = Readonly<{
  canSend: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isSignerRequiredForEdit: boolean;
  editUiState: ReturnType<typeof useContactEditSignerUiState>["editUiState"];
  isEditSessionActive: boolean;
  isDeleting: boolean;
  deleteLifecycle: ReturnType<typeof useContactAddressDetailActionsViewModel>["deleteLifecycle"];
  onSendPress: () => void;
  onEditPress: () => void;
  onDeletePress: () => void;
  requestSaveApproval: () => Promise<boolean>;
  onSignerMismatchCancel: () => void;
  onConnectDifferentDevice: () => void;
  onEditClose: () => void;
  confirmDelete: () => Promise<void>;
  cancelDelete: () => void;
}>;

export function useContactAddressDetailActionsFlowViewModel({
  contactId,
  addressId,
  ports,
  onSend,
  onDeleteSuccess,
  onCloseAddressDetail,
}: UseContactAddressDetailActionsFlowViewModelOptions): UseContactAddressDetailActionsFlowViewModelResult {
  const resolvedAddressId = addressId ?? PLACEHOLDER_ADDRESS_ID;
  const {
    sendIntent,
    editIntent,
    deleteLifecycle,
    openDelete,
    cancelDelete,
    confirmDelete: confirmDeleteAction,
    isSignerRequiredForEdit,
  } = useContactAddressDetailActionsViewModel(contactId, resolvedAddressId, ports);
  const {
    editUiState,
    isEditSessionActive,
    openSignerMismatchDialog,
    openEditDialog,
    onSignerMismatchCancel,
    onConnectDifferentDevice,
    onEditClose: closeEditUiState,
    resetEditUiState,
  } = useContactEditSignerUiState();
  const [isDeleting, setIsDeleting] = useState(false);
  const isSelectionActive = addressId !== undefined;
  const canSend = isSelectionActive && sendIntent !== undefined;
  const canEdit = isSelectionActive && editIntent !== undefined;
  const canDelete = isSelectionActive;

  const onSendPress = useCallback(() => {
    if (sendIntent === undefined) {
      return;
    }

    onSend?.(sendIntent);
  }, [onSend, sendIntent]);

  const onEditPress = useCallback(() => {
    if (editIntent === undefined) {
      return;
    }

    openEditDialog();
  }, [editIntent, openEditDialog]);

  const requestSaveApproval = useCallback(async () => {
    if (!isSignerRequiredForEdit || editIntent === undefined) {
      return true;
    }

    const [expectedSignerId, currentSignerId] = await Promise.all([
      ports.signerValidation.getExpectedSignerId({
        contactId: editIntent.contactId,
        addressId: editIntent.addressId,
      }),
      ports.signerValidation.getCurrentSignerId(),
    ]);
    const status = resolveContactSignerValidationResult(expectedSignerId, currentSignerId);

    if (status === CONTACT_SIGNER_MISMATCH_ERROR) {
      openSignerMismatchDialog();
      return false;
    }

    return true;
  }, [editIntent, isSignerRequiredForEdit, openSignerMismatchDialog, ports.signerValidation]);

  const onEditClose = useCallback(() => {
    closeEditUiState();
  }, [closeEditUiState]);

  const onDeletePress = useCallback(() => {
    if (!canDelete) {
      return;
    }

    openDelete();
  }, [canDelete, openDelete]);

  const confirmDelete = useCallback(async () => {
    if (!canDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      await confirmDeleteAction();
    } finally {
      setIsDeleting(false);
    }
  }, [canDelete, confirmDeleteAction]);

  useEffect(() => {
    if (deleteLifecycle.status !== "success") {
      return;
    }

    onDeleteSuccess?.();
    onCloseAddressDetail?.();
    cancelDelete();
  }, [cancelDelete, deleteLifecycle.status, onCloseAddressDetail, onDeleteSuccess]);

  useEffect(() => {
    if (addressId === undefined) {
      resetEditUiState();
      cancelDelete();
    }
  }, [addressId, cancelDelete, resetEditUiState]);

  return {
    canSend,
    canEdit,
    canDelete,
    isSignerRequiredForEdit,
    editUiState,
    isEditSessionActive,
    isDeleting,
    deleteLifecycle,
    onSendPress,
    onEditPress,
    onDeletePress,
    requestSaveApproval,
    onSignerMismatchCancel,
    onConnectDifferentDevice,
    onEditClose,
    confirmDelete,
    cancelDelete,
  };
}
