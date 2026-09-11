import type { ContactsDeleteAddressDialogProps } from "../components/ContactsDeleteAddressDialog/types";
import type { ContactsEditSignerMismatchDialogProps } from "../components/ContactsEditSignerMismatchDialog/types";
import type {
  ContactsRenameAddressDialogProps,
  RenameAddressDialogViewModel,
} from "@features/flow-contacts-edit-address";
import { EMPTY_ADDRESS_ENTRY_STATE } from "@features/platform-contacts";
import type { UseContactAddressDetailActionsFlowViewModelResult } from "../useContactAddressDetailActionsFlowViewModel";
import type { ContactAddressDetailActionsLabels } from "./resolveContactAddressDetailActionsLabels";

export type ContactAddressDetailActionsUiState = Readonly<{
  addressDetailDialog: Readonly<{
    onSend?: UseContactAddressDetailActionsFlowViewModelResult["onSendPress"];
    onEdit?: UseContactAddressDetailActionsFlowViewModelResult["onEditPress"];
    onDelete?: UseContactAddressDetailActionsFlowViewModelResult["onDeletePress"];
    canSend: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }>;
  delete: ContactsDeleteAddressDialogProps;
  rename: ContactsRenameAddressDialogProps;
  signerMismatch: ContactsEditSignerMismatchDialogProps;
}>;

export function createInactiveContactAddressDetailActionsUiState(
  labels: ContactAddressDetailActionsLabels,
): ContactAddressDetailActionsUiState {
  return {
    addressDetailDialog: {
      canSend: false,
      canEdit: false,
      canDelete: false,
    },
    delete: {
      isOpen: false,
      isDeleting: false,
      labels: labels.delete,
      onConfirm: async () => undefined,
      onCancel: () => undefined,
    },
    rename: {
      isOpen: false,
      isSaving: false,
      draftLabel: "",
      invalidLabelError: null,
      addressEntry: EMPTY_ADDRESS_ENTRY_STATE,
      isConfirmEnabled: false,
      isDeviceRequired: false,
      labels: labels.rename,
      onOpen: () => undefined,
      onClose: () => undefined,
      onDraftLabelChange: () => undefined,
      onAddressChange: () => undefined,
      onConfirm: async () => undefined,
    },
    signerMismatch: {
      isOpen: false,
      labels: labels.signerMismatch,
      onConnectDifferentDevice: () => undefined,
      onCancel: () => undefined,
    },
  };
}

export function createActiveContactAddressDetailActionsUiState(
  flow: UseContactAddressDetailActionsFlowViewModelResult,
  renameViewModel: RenameAddressDialogViewModel,
  labels: ContactAddressDetailActionsLabels,
): ContactAddressDetailActionsUiState {
  return {
    addressDetailDialog: {
      onSend: flow.onSendPress,
      onEdit: flow.onEditPress,
      onDelete: flow.onDeletePress,
      canSend: flow.canSend,
      canEdit: flow.canEdit,
      canDelete: flow.canDelete,
    },
    delete: {
      isOpen: flow.deleteLifecycle.status === "open",
      isDeleting: flow.isDeleting,
      labels: labels.delete,
      onConfirm: flow.confirmDelete,
      onCancel: flow.cancelDelete,
    },
    rename: {
      ...renameViewModel,
      isDeviceRequired: flow.isSignerRequiredForEdit,
      labels: labels.rename,
    },
    signerMismatch: {
      isOpen: flow.editUiState === "signer-mismatch",
      labels: labels.signerMismatch,
      onConnectDifferentDevice: flow.onConnectDifferentDevice,
      onCancel: flow.onSignerMismatchCancel,
    },
  };
}
