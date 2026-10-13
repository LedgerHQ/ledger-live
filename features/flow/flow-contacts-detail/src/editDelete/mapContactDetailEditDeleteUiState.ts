import type { ContactsDeleteContactDialogProps } from "@features/flow-contacts-delete-contact";
import type { ContactsEditSignerMismatchDialogProps } from "../components/ContactsEditSignerMismatchDialog/types";
import type {
  ContactsRenameContactDialogProps,
  RenameContactDialogViewModel,
} from "@features/flow-contacts-edit-contact";
import type { UseContactDetailEditDeleteFlowViewModelResult } from "./useContactDetailEditDeleteFlowViewModel";
import type { ContactDetailEditDeleteLabels } from "./resolveContactDetailEditDeleteLabels";

export type ContactDetailEditDeleteUiState = Readonly<{
  rename: ContactsRenameContactDialogProps;
  delete: ContactsDeleteContactDialogProps;
  signerMismatch: ContactsEditSignerMismatchDialogProps;
}>;

export function createContactDetailEditDeleteUiState(
  flow: UseContactDetailEditDeleteFlowViewModelResult,
  renameViewModel: RenameContactDialogViewModel,
  labels: ContactDetailEditDeleteLabels,
): ContactDetailEditDeleteUiState {
  return {
    rename: {
      ...renameViewModel,
      isDeviceRequired: flow.isSignerRequiredForEdit,
      labels: labels.rename,
    },
    delete: {
      isOpen: flow.deleteLifecycle.status === "open",
      isDeleting: flow.isDeleting,
      labels: labels.delete,
      onConfirm: flow.confirmDelete,
      onCancel: flow.cancelDelete,
    },
    signerMismatch: {
      isOpen: flow.editUiState === "signer-mismatch",
      labels: labels.signerMismatch,
      onConnectDifferentDevice: flow.onConnectDifferentDevice,
      onCancel: flow.onSignerMismatchCancel,
    },
  };
}
