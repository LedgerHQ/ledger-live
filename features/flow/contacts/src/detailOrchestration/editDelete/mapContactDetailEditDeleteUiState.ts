import type {
  ContactsDeleteContactDialogProps,
  ContactsEditSignerDialogProps,
  ContactsEditSignerMismatchDialogProps,
  UseContactDetailEditDeleteFlowViewModelResult,
} from "@features/flow-contacts-detail";
import type {
  ContactsRenameContactDialogProps,
  RenameContactDialogViewModel,
} from "@features/flow-contacts-edit-contact";
import type { ContactDetailEditDeleteLabels } from "./resolveContactDetailEditDeleteLabels";

export type ContactDetailEditDeleteUiState = Readonly<{
  rename: ContactsRenameContactDialogProps;
  delete: ContactsDeleteContactDialogProps;
  signer: ContactsEditSignerDialogProps;
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
      labels: labels.rename,
    },
    delete: {
      isOpen: flow.deleteLifecycle.status === "open",
      isDeleting: flow.isDeleting,
      labels: labels.delete,
      onConfirm: flow.confirmDelete,
      onCancel: flow.cancelDelete,
    },
    signer: {
      isOpen: flow.editUiState === "signer-open",
      labels: labels.signer,
      onConfirm: flow.onSignerConfirm,
      onCancel: flow.onSignerCancel,
    },
    signerMismatch: {
      isOpen: flow.editUiState === "signer-mismatch",
      labels: labels.signerMismatch,
      onConnectDifferentDevice: flow.onConnectDifferentDevice,
      onCancel: flow.onSignerMismatchCancel,
    },
  };
}
