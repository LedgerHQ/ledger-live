import type { ContactsDeleteAddressDialogProps } from "@features/flow-contacts-delete-address";
import type { ContactsEditSignerMismatchDialogProps } from "../components/ContactsEditSignerMismatchDialog/types";
import type {
  ContactsRenameAddressDialogProps,
  RenameAddressDialogViewModel,
} from "@features/flow-contacts-edit-address";
import { EMPTY_ADDRESS_ENTRY_STATE } from "@features/platform-contacts";
import type { UseContactAddressDetailActionsFlowViewModelResult } from "../useContactAddressDetailActionsFlowViewModel";

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
  supportsDomain: boolean,
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
      supportsDomain,
      onOpen: () => undefined,
      onClose: () => undefined,
      onDraftLabelChange: () => undefined,
      onAddressChange: () => undefined,
      onConfirm: async () => undefined,
    },
    signerMismatch: {
      isOpen: false,
      onConnectDifferentDevice: () => undefined,
      onCancel: () => undefined,
    },
  };
}

export function createActiveContactAddressDetailActionsUiState(
  flow: UseContactAddressDetailActionsFlowViewModelResult,
  renameViewModel: RenameAddressDialogViewModel,
  supportsDomain: boolean,
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
      onConfirm: flow.confirmDelete,
      onCancel: flow.cancelDelete,
    },
    rename: {
      ...renameViewModel,
      isDeviceRequired: flow.isSignerRequiredForEdit,
      supportsDomain,
    },
    signerMismatch: {
      isOpen: flow.editUiState === "signer-mismatch",
      onConnectDifferentDevice: flow.onConnectDifferentDevice,
      onCancel: flow.onSignerMismatchCancel,
    },
  };
}
