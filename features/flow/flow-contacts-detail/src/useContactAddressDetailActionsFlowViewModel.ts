import {
  CONTACT_SIGNER_MISMATCH_ERROR,
  ContactAddressIdSchema,
  resolveContactSignerValidationResult,
  type ContactAddressId,
  type ContactId,
} from "@domain/entity-contact";
import { useDeleteAddressFlowViewModel } from "@features/flow-contacts-delete-address";
import { useCallback, useEffect } from "react";
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
  deleteLifecycle: ReturnType<typeof useDeleteAddressFlowViewModel>["deleteLifecycle"];
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
  const { sendIntent, editIntent, isSignerRequiredForEdit } =
    useContactAddressDetailActionsViewModel(contactId, resolvedAddressId);
  const onAddressDeleted = useCallback(() => {
    onDeleteSuccess?.();
    onCloseAddressDetail?.();
  }, [onCloseAddressDetail, onDeleteSuccess]);
  const { canDelete, deleteLifecycle, isDeleting, openDelete, cancelDelete, confirmDelete } =
    useDeleteAddressFlowViewModel({
      contactId,
      addressId,
      deletionPort: ports.deletion,
      onSuccess: onAddressDeleted,
    });
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
  const canSend = addressId !== undefined && sendIntent !== undefined;
  const canEdit = addressId !== undefined && editIntent !== undefined;

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
    openDelete();
  }, [openDelete]);

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
