import { type ContactId } from "@domain/entity-contact";
import {
  type ContactsEditSignerMismatchDrawerProps,
  type ContactDetailActionsLabels,
  createContactDetailEditDeleteUiState,
  resolveContactDetailEditDeleteLabels,
  useContactDetailEditDeleteAnalytics,
  useContactDetailEditDeleteFlowBindings,
  useContactsEditDeletePorts,
} from "@features/flow-contacts";
import type { ContactsDeleteContactDrawerProps } from "@features/flow-contacts-delete-contact";
import type { ContactsRenameContactDrawerProps } from "@features/flow-contacts-edit-contact";
import type { ContactDeviceIntentsPort } from "@features/platform-contacts";
import { useMemo } from "react";
import { useTranslation } from "~/context/Locale";
import { useContactsAnalytics } from "../../../analytics/useContactsAnalytics";

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
  signerMismatchSheet: ContactsEditSignerMismatchDrawerProps;
  onOpenActionsMenu: () => void;
}>;

export function useContactDetailEditDeleteAdapter(
  contactId: ContactId,
  onDeleteSuccess: () => void,
  deviceIntents: ContactDeviceIntentsPort,
): ContactDetailEditDeleteFlowProps {
  const { t } = useTranslation();
  const analytics = useContactsAnalytics();
  const ports = useContactsEditDeletePorts(deviceIntents);
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
  const { onEdit, onDelete } = useContactDetailEditDeleteAnalytics(
    analytics,
    {
      onEditPress: flow.onEditPress,
      onDeletePress: flow.onDeletePress,
      openDelete: flow.openDelete,
    },
    uiState.signerMismatch.isOpen,
  );

  return {
    onOpenActionsMenu: flow.onOpenActionsMenu,
    actionsMenu: {
      isOpen: flow.isActionsMenuOpen,
      canDelete: flow.canDelete,
      labels: labels.actions,
      onEdit,
      onDelete,
      onClose: flow.onCloseActionsMenu,
    },
    renameDrawer: uiState.rename,
    deleteDrawer: uiState.delete,
    signerMismatchSheet: uiState.signerMismatch,
  };
}
