import { ContactIdSchema, type ContactId } from "@domain/entity-contact";
import {
  type ContactsEditSignerDialogProps,
  type ContactsEditSignerMismatchDialogProps,
  type ContactDetailActionsLabels,
  createContactDetailEditDeleteUiState,
  resolveContactDetailEditDeleteLabels,
  useContactDetailEditDeleteAnalytics,
  useContactDetailEditDeleteFlowBindings,
  useContactsEditDeletePorts,
} from "@features/flow-contacts";
import type { ContactsDeleteContactDialogProps } from "@features/flow-contacts-delete-contact";
import type { ContactsRenameContactDialogProps } from "@features/flow-contacts-edit-contact";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ContactDeviceIntentsPort } from "@features/platform-contacts";
import { useContactsAnalytics } from "../../analytics";

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
  signerMismatchDialog: ContactsEditSignerMismatchDialogProps;
}>;

export function useContactDetailEditDeleteAdapter(
  contactId: ContactId | undefined,
  onDeleteSuccess: () => void,
  deviceIntents: ContactDeviceIntentsPort,
): ContactDetailEditDeleteDialogProps {
  const { t } = useTranslation();
  const analytics = useContactsAnalytics();
  const ports = useContactsEditDeletePorts(deviceIntents);
  const resolvedContactId = contactId ?? ContactIdSchema.parse("contact-me");
  const { flow, renameViewModel } = useContactDetailEditDeleteFlowBindings({
    contactId: resolvedContactId,
    ports,
    onDeleteSuccess,
  });
  const labels = useMemo(() => resolveContactDetailEditDeleteLabels({ t }), [t]);
  const uiState = useMemo(
    () => createContactDetailEditDeleteUiState(flow, renameViewModel, labels),
    [flow, labels, renameViewModel],
  );
  const { onEdit, onDelete } = useContactDetailEditDeleteAnalytics(
    analytics,
    flow,
    uiState.signerMismatch.isOpen,
  );

  return {
    detailActions: contactId
      ? {
          canDelete: flow.canDelete,
          labels: labels.actions,
          onEdit,
          onDelete,
        }
      : undefined,
    renameDialog: uiState.rename,
    deleteDialog: uiState.delete,
    signerDialog: uiState.signer,
    signerMismatchDialog: uiState.signerMismatch,
  };
}
