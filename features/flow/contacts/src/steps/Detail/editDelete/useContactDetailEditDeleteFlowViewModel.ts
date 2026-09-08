import {
  CONTACT_SIGNER_MISMATCH_ERROR,
  resolveContactSignerValidationResult,
  selectContactById,
  type ContactId,
} from "@domain/entity-contact";
import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { useDeleteContactFlowViewModel } from "@features/flow-contacts-delete-contact";
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
  Pick<
    ReturnType<typeof useDeleteContactFlowViewModel>,
    "deleteIntent" | "deleteLifecycle" | "openDelete" | "cancelDelete" | "confirmDelete"
  > &
  Readonly<{
    canDelete: boolean;
    contactName: string;
    editUiState: ContactDetailEditUiState;
    isEditSessionActive: boolean;
    isActionsMenuOpen: boolean;
    isDeleting: boolean;
    onEditPress: () => void;
    onDeletePress: () => void;
    requestSaveApproval: () => Promise<boolean>;
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
  const { editIntent, isSignerRequiredForEdit } = useContactDetailActionsViewModel(
    contactId,
    ports,
  );
  const deleteFlow = useDeleteContactFlowViewModel({
    contactId,
    deletionPort: ports.deletion,
    onSuccess: onDeleteSuccess,
  });
  const {
    editUiState,
    isEditSessionActive,
    openSignerMismatchDialog,
    openEditDialog,
    onSignerMismatchCancel,
    onConnectDifferentDevice,
    onEditClose: closeEditUiState,
  } = useContactEditSignerUiState();
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const canDelete = deleteFlow.canDelete;
  const contactName = contact?.name ?? "";

  const onEditPress = useCallback(() => {
    setIsActionsMenuOpen(false);
    openEditDialog();
  }, [openEditDialog]);

  const requestSaveApproval = useCallback(async () => {
    const validationLookup = editIntent?.signerValidationLookup;

    if (!isSignerRequiredForEdit || validationLookup === undefined) {
      return true;
    }

    const [expectedSignerId, currentSignerId] = await Promise.all([
      ports.signerValidation.getExpectedSignerId(validationLookup),
      ports.signerValidation.getCurrentSignerId(),
    ]);
    const status = resolveContactSignerValidationResult(expectedSignerId, currentSignerId);

    if (status === CONTACT_SIGNER_MISMATCH_ERROR) {
      openSignerMismatchDialog();
      return false;
    }

    return true;
  }, [
    editIntent?.signerValidationLookup,
    isSignerRequiredForEdit,
    openSignerMismatchDialog,
    ports.signerValidation,
  ]);

  const onEditClose = useCallback(() => {
    closeEditUiState();
  }, [closeEditUiState]);

  const onDeletePress = useCallback(() => {
    setIsActionsMenuOpen(false);
  }, []);

  const onOpenActionsMenu = useCallback(() => {
    setIsActionsMenuOpen(true);
  }, []);

  const onCloseActionsMenu = useCallback(() => {
    setIsActionsMenuOpen(false);
  }, []);

  return {
    editIntent,
    deleteIntent: deleteFlow.deleteIntent,
    deleteLifecycle: deleteFlow.deleteLifecycle,
    isSignerRequiredForEdit,
    openDelete: deleteFlow.openDelete,
    cancelDelete: deleteFlow.cancelDelete,
    confirmDelete: deleteFlow.confirmDelete,
    canDelete,
    contactName,
    editUiState,
    isEditSessionActive,
    isActionsMenuOpen,
    isDeleting: deleteFlow.isDeleting,
    onEditPress,
    onDeletePress,
    requestSaveApproval,
    onSignerMismatchCancel,
    onConnectDifferentDevice,
    onEditClose,
    onOpenActionsMenu,
    onCloseActionsMenu,
  };
}
