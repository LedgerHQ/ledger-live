import { INVALID_CONTACT_NAME_ERROR_NAME, type ContactId } from "@domain/entity-contact";
import {
  type ContactsDeleteContactDrawerProps,
  type ContactsEditSignerDrawerProps,
  type ContactsRenameContactDrawerProps,
  type ContactDetailActionsLabels,
  useContactDetailEditDeleteFlowBindings,
  useContactsEditDeletePorts,
} from "@features/flow-contacts";
import { useMemo } from "react";
import { useTranslation } from "~/context/Locale";

export type ContactDetailEditDeleteFlowProps = Readonly<{
  actionsMenu: Readonly<{
    isOpen: boolean;
    canDelete: boolean;
    labels: ContactDetailActionsLabels;
    onEdit: () => void;
    onDelete: () => void;
    onClose: () => void;
  }>;
  renameDrawer: ContactsRenameContactDrawerProps;
  deleteDrawer: ContactsDeleteContactDrawerProps;
  signerDrawer: ContactsEditSignerDrawerProps;
  onOpenActionsMenu: () => void;
}>;

export function useContactDetailEditDeleteAdapter(
  contactId: ContactId,
  onDeleteSuccess: () => void,
): ContactDetailEditDeleteFlowProps {
  const { t } = useTranslation();
  const ports = useContactsEditDeletePorts();
  const { flow, renameViewModel } = useContactDetailEditDeleteFlowBindings({
    contactId,
    ports,
    onDeleteSuccess,
  });
  const actionLabels = useMemo<ContactDetailActionsLabels>(
    () => ({
      editContact: t("contacts.detailActions.editName"),
      deleteContact: t("contacts.detailActions.deleteContact"),
    }),
    [t],
  );
  const renameLabels = useMemo(
    () => ({
      title: t("contacts.editContact.title"),
      namePlaceholder: t("contacts.editContact.namePlaceholder"),
      namingDisclaimer: t("contacts.editContact.namingDisclaimer"),
      applyChanges: t("contacts.editContact.applyChanges"),
      nameValidationErrors: {
        [INVALID_CONTACT_NAME_ERROR_NAME]: t("contacts.editContact.invalidNameError"),
      },
    }),
    [t],
  );
  const deleteLabels = useMemo(
    () => ({
      title: t("contacts.deleteContact.title"),
      description: t("contacts.deleteContact.mobileDescription"),
      confirm: t("contacts.deleteContact.confirm"),
      cancel: t("contacts.deleteContact.cancel"),
    }),
    [t],
  );
  const signerLabels = useMemo(
    () => ({
      title: t("contacts.editSigner.title"),
      description: t("contacts.editSigner.description"),
      confirm: t("contacts.editSigner.confirm"),
      cancel: t("contacts.editSigner.cancel"),
    }),
    [t],
  );

  return {
    onOpenActionsMenu: flow.onOpenActionsMenu,
    actionsMenu: {
      isOpen: flow.isActionsMenuOpen,
      canDelete: flow.canDelete,
      labels: actionLabels,
      onEdit: flow.onEditPress,
      onDelete: flow.onDeletePress,
      onClose: flow.onCloseActionsMenu,
    },
    renameDrawer: {
      ...renameViewModel,
      labels: renameLabels,
    },
    deleteDrawer: {
      isOpen: flow.deleteLifecycle.status === "open",
      isDeleting: flow.isDeleting,
      labels: deleteLabels,
      onConfirm: flow.confirmDelete,
      onCancel: flow.cancelDelete,
    },
    signerDrawer: {
      isOpen: flow.editUiState === "signer-open",
      labels: signerLabels,
      onConfirm: flow.onSignerConfirm,
      onCancel: flow.onSignerCancel,
    },
  };
}
