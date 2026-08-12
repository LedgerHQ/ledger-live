import { ContactIdSchema, type ContactId } from "@domain/entity-contact";
import {
  type ContactsDeleteContactDialogProps,
  type ContactsEditSignerDialogProps,
  type ContactsEditSignerMismatchDialogProps,
  type ContactsRenameContactDialogProps,
  type ContactDetailActionsLabels,
  createContactDetailEditDeleteUiState,
  resolveContactDetailEditDeleteLabels,
  useContactDetailEditDeleteFlowBindings,
  useContactsEditDeletePorts,
} from "@features/flow-contacts";
import { useMemo } from "react";
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
  signerMismatchDialog: ContactsEditSignerMismatchDialogProps;
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
  const labels = useMemo(() => resolveContactDetailEditDeleteLabels({ t }), [t]);
  const uiState = useMemo(
    () => createContactDetailEditDeleteUiState(flow, renameViewModel, labels),
    [flow, labels, renameViewModel],
  );

  return {
    detailActions: contactId
      ? {
          canDelete: flow.canDelete,
          labels: labels.actions,
          onEdit: flow.onEditPress,
          onDelete: flow.onDeletePress,
        }
      : undefined,
    renameDialog: uiState.rename,
    deleteDialog: uiState.delete,
    signerDialog: uiState.signer,
    signerMismatchDialog: uiState.signerMismatch,
  };
}
