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

type SignerPendingAction = "edit" | "delete";

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
  editUiState: ReturnType<typeof useContactEditSignerUiState>["editUiState"];
  isDeleting: boolean;
  deleteLifecycle: ReturnType<typeof useContactAddressDetailActionsViewModel>["deleteLifecycle"];
  onSendPress: () => void;
  onEditPress: () => void;
  onDeletePress: () => void;
  onSignerConfirm: () => Promise<void>;
  onSignerCancel: () => void;
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
    deleteIntent,
    deleteLifecycle,
    openDelete,
    cancelDelete,
    confirmDelete: confirmDeleteAction,
    isSignerRequiredForEdit,
    isSignerRequiredForDelete,
  } = useContactAddressDetailActionsViewModel(contactId, resolvedAddressId, ports);
  const {
    editUiState,
    openSignerDialog,
    openSignerMismatchDialog,
    openEditDialog,
    closeSignerDialog,
    onSignerCancel: closeSignerOnCancel,
    onSignerMismatchCancel,
    onConnectDifferentDevice,
    onEditClose: closeEditUiState,
    resetEditUiState,
  } = useContactEditSignerUiState();
  const [isDeleting, setIsDeleting] = useState(false);
  const [signerPendingAction, setSignerPendingAction] = useState<SignerPendingAction | null>(null);
  const isSelectionActive = addressId !== undefined;
  const canSend = isSelectionActive && sendIntent !== undefined;
  const canEdit = isSelectionActive && editIntent !== undefined;
  const canDelete = isSelectionActive;

  const clearSignerPendingAction = useCallback(() => {
    setSignerPendingAction(null);
  }, []);

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

    if (isSignerRequiredForEdit) {
      setSignerPendingAction("edit");
      openSignerDialog();
      return;
    }

    openEditDialog();
  }, [editIntent, isSignerRequiredForEdit, openEditDialog, openSignerDialog]);

  const onSignerConfirm = useCallback(async () => {
    const pendingAction = signerPendingAction;
    const validationTarget =
      pendingAction === "edit"
        ? editIntent
        : pendingAction === "delete"
          ? deleteIntent
          : undefined;

    if (validationTarget === undefined) {
      return;
    }

    const [expectedSignerId, currentSignerId] = await Promise.all([
      ports.signerValidation.getExpectedSignerId({
        contactId: validationTarget.contactId,
        addressId: validationTarget.addressId,
      }),
      ports.signerValidation.getCurrentSignerId(),
    ]);
    const status = resolveContactSignerValidationResult(expectedSignerId, currentSignerId);

    if (status === CONTACT_SIGNER_MISMATCH_ERROR) {
      openSignerMismatchDialog();
      return;
    }

    clearSignerPendingAction();

    if (pendingAction === "edit") {
      openEditDialog();
      return;
    }

    closeSignerDialog();
    openDelete();
  }, [
    clearSignerPendingAction,
    closeSignerDialog,
    deleteIntent,
    editIntent,
    openDelete,
    openEditDialog,
    openSignerMismatchDialog,
    ports.signerValidation,
    signerPendingAction,
  ]);

  const onSignerCancel = useCallback(() => {
    clearSignerPendingAction();
    closeSignerOnCancel();
  }, [clearSignerPendingAction, closeSignerOnCancel]);

  const onEditClose = useCallback(() => {
    closeEditUiState();
  }, [closeEditUiState]);

  const onDeletePress = useCallback(() => {
    if (!canDelete) {
      return;
    }

    if (isSignerRequiredForDelete) {
      setSignerPendingAction("delete");
      openSignerDialog();
      return;
    }

    openDelete();
  }, [canDelete, isSignerRequiredForDelete, openDelete, openSignerDialog]);

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
      clearSignerPendingAction();
      resetEditUiState();
      cancelDelete();
    }
  }, [addressId, cancelDelete, clearSignerPendingAction, resetEditUiState]);

  return {
    canSend,
    canEdit,
    canDelete,
    editUiState,
    isDeleting,
    deleteLifecycle,
    onSendPress,
    onEditPress,
    onDeletePress,
    onSignerConfirm,
    onSignerCancel,
    onSignerMismatchCancel,
    onConnectDifferentDevice,
    onEditClose,
    confirmDelete,
    cancelDelete,
  };
}
