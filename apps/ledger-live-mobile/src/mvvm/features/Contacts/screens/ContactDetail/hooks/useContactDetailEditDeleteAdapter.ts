import { type ContactId } from "@domain/entity-contact";
import {
  type ContactsDeleteContactDrawerProps,
  type ContactsEditSignerDrawerProps,
  type ContactsEditSignerMismatchDrawerProps,
  type ContactsRenameContactDrawerProps,
  type ContactDetailActionsLabels,
  createContactDetailEditDeleteUiState,
  resolveContactDetailEditDeleteLabels,
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
  signerMismatchSheet: ContactsEditSignerMismatchDrawerProps;
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
  const labels = useMemo(
    () =>
      resolveContactDetailEditDeleteLabels({
        t,
        editContactLabelKey: "contacts.detailActions.editName",
        deleteDescriptionKey: "contacts.deleteContact.mobileDescription",
      }),
    [t],
  );
  const uiState = useMemo(
    () => createContactDetailEditDeleteUiState(flow, renameViewModel, labels),
    [flow, labels, renameViewModel],
  );

  return {
    onOpenActionsMenu: flow.onOpenActionsMenu,
    actionsMenu: {
      isOpen: flow.isActionsMenuOpen,
      canDelete: flow.canDelete,
      labels: labels.actions,
      onEdit: flow.onEditPress,
      onDelete: flow.onDeletePress,
      onClose: flow.onCloseActionsMenu,
    },
    renameDrawer: uiState.rename,
    deleteDrawer: uiState.delete,
    signerDrawer: uiState.signer,
    signerMismatchSheet: uiState.signerMismatch,
  };
}
