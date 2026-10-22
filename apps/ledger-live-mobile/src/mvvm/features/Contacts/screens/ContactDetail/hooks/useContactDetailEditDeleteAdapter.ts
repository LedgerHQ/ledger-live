import { type ContactId } from "@domain/entity-contact";
import {
  useContactDetailEditDeleteAnalytics,
  useContactsMeContact,
  useContactsEditDeletePorts,
} from "@features/flow-contacts";
import {
  type ContactsEditSignerMismatchDrawerProps,
  createContactDetailEditDeleteUiState,
  useContactDetailEditDeleteFlowBindings,
} from "@features/flow-contacts-detail";
import type { ContactsDeleteContactDrawerProps } from "@features/flow-contacts-delete-contact";
import type { ContactsRenameContactDrawerProps } from "@features/flow-contacts-edit-contact";
import type { ContactDeviceIntentsPort } from "@features/platform-contacts";
import { useMemo } from "react";
import { useContactsAnalytics } from "../../../analytics/useContactsAnalytics";

export type ContactDetailEditDeleteFlowProps = Readonly<{
  actionsMenu: Readonly<{
    isOpen: boolean;
    canDelete: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onClose: () => void;
  }>;
  renameDrawer: ContactsRenameContactDrawerProps;
  deleteDrawer: ContactsDeleteContactDrawerProps;
  signerMismatchSheet: ContactsEditSignerMismatchDrawerProps;
  onOpenActionsMenu: () => void;
}>;

export function useContactDetailEditDeleteAdapter(
  contactId: ContactId,
  onDeleteSuccess: () => void,
  deviceIntents: ContactDeviceIntentsPort,
): ContactDetailEditDeleteFlowProps {
  const analytics = useContactsAnalytics();
  const meContact = useContactsMeContact();
  const ports = useContactsEditDeletePorts(deviceIntents);
  const { flow, renameViewModel } = useContactDetailEditDeleteFlowBindings({
    contactId,
    ports,
    onDeleteSuccess,
  });
  const uiState = useMemo(
    () => createContactDetailEditDeleteUiState(flow, renameViewModel),
    [flow, renameViewModel],
  );
  const { onEdit, onDelete, onConfirmDelete, onValidateEdit } = useContactDetailEditDeleteAnalytics(
    analytics,
    {
      onEditPress: flow.onEditPress,
      onDeletePress: flow.onDeletePress,
      openDelete: flow.openDelete,
      confirmDelete: flow.confirmDelete,
    },
    uiState.signerMismatch.isOpen,
    contactId === meContact.id,
  );

  return {
    onOpenActionsMenu: flow.onOpenActionsMenu,
    actionsMenu: {
      isOpen: flow.isActionsMenuOpen,
      canDelete: flow.canDelete,
      onEdit,
      onDelete,
      onClose: flow.onCloseActionsMenu,
    },
    renameDrawer: {
      ...uiState.rename,
      onConfirm: async () => {
        onValidateEdit();
        await uiState.rename.onConfirm();
      },
    },
    deleteDrawer: { ...uiState.delete, onConfirm: onConfirmDelete },
    signerMismatchSheet: uiState.signerMismatch,
  };
}
