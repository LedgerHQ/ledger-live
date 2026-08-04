import {
  ContactIdSchema,
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
  type ContactId,
} from "@domain/entity-contact";
import {
  type ContactsDeleteContactDialogProps,
  type ContactsEditSignerDialogProps,
  type ContactsRenameContactDialogProps,
  type ContactDetailActionsLabels,
  useContactDetailEditDeleteFlowBindings,
  useContactsEditDeletePorts,
} from "@features/flow-contacts";
import { useTranslation } from "react-i18next";

export type ContactDetailEditDeleteDialogProps = Readonly<{
  detailActions?: Readonly<{
    canDelete: boolean;
    labels: ContactDetailActionsLabels;
    onEdit: () => void;
    onDelete: () => void;
  }>;
  renameDialog: ContactsRenameContactDialogProps;
  deleteDialog: ContactsDeleteContactDialogProps;
  signerDialog: ContactsEditSignerDialogProps;
}>;

export function useContactDetailEditDeleteAdapter(
  contactId: ContactId | undefined,
  onDeleteSuccess: () => void,
): ContactDetailEditDeleteDialogProps {
  const { t } = useTranslation();
  const ports = useContactsEditDeletePorts();
  const resolvedContactId = contactId ?? ContactIdSchema.parse("contact-me");
  const { flow, renameViewModel } = useContactDetailEditDeleteFlowBindings({
    contactId: resolvedContactId,
    ports,
    onDeleteSuccess,
  });
  const actionLabels: ContactDetailActionsLabels = {
    editContact: t("contacts.detailActions.editContact"),
    deleteContact: t("contacts.detailActions.deleteContact"),
  };
  const renameLabels = {
    title: t("contacts.editContact.title"),
    namePlaceholder: t("contacts.editContact.namePlaceholder"),
    namingDisclaimer: t("contacts.editContact.namingDisclaimer"),
    applyChanges: t("contacts.editContact.applyChanges"),
    nameValidationErrors: {
      [INVALID_CONTACT_NAME_ERROR_NAME]: t("contacts.editContact.invalidNameError"),
      [DUPLICATE_CONTACT_NAME_ERROR_NAME]: t("contacts.addContactDrawer.duplicateNameError"),
    },
  };
  const deleteLabels = {
    title: t("contacts.deleteContact.title"),
    description: t("contacts.deleteContact.description"),
    confirm: t("contacts.deleteContact.confirm"),
    cancel: t("contacts.deleteContact.cancel"),
  };
  const signerLabels = {
    title: t("contacts.editSigner.title"),
    description: t("contacts.editSigner.description"),
    confirm: t("contacts.editSigner.confirm"),
    cancel: t("contacts.editSigner.cancel"),
  };

  return {
    detailActions: contactId
      ? {
          canDelete: flow.canDelete,
          labels: actionLabels,
          onEdit: flow.onEditPress,
          onDelete: flow.onDeletePress,
        }
      : undefined,
    renameDialog: {
      ...renameViewModel,
      labels: renameLabels,
    },
    deleteDialog: {
      isOpen: flow.deleteLifecycle.status === "open",
      isDeleting: flow.isDeleting,
      labels: deleteLabels,
      onConfirm: flow.confirmDelete,
      onCancel: flow.cancelDelete,
    },
    signerDialog: {
      isOpen: flow.editUiState === "signer-open",
      labels: signerLabels,
      onConfirm: flow.onSignerConfirm,
      onCancel: flow.onSignerCancel,
    },
  };
}
