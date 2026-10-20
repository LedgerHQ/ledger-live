import { ContactIdSchema, type ContactId } from "@domain/entity-contact";
import {
  useContactDetailEditDeleteAnalytics,
  useContactsMeContact,
  useContactsEditDeletePorts,
} from "@features/flow-contacts";
import {
  type ContactsEditSignerMismatchDialogProps,
  createContactDetailEditDeleteUiState,
  useContactDetailEditDeleteFlowBindings,
} from "@features/flow-contacts-detail";
import type { ContactsDeleteContactDialogProps } from "@features/flow-contacts-delete-contact";
import type { ContactsRenameContactDialogProps } from "@features/flow-contacts-edit-contact";
import { useMemo } from "react";
import type { ContactDeviceIntentsPort } from "@features/platform-contacts";
import { useContactsAnalytics } from "../../analytics";

export type ContactDetailEditDeleteDialogProps = Readonly<{
  detailActions?: Readonly<{
    canDelete: boolean;
    onEdit: () => void;
    onDelete: () => void;
  }>;
  renameDialog: ContactsRenameContactDialogProps;
  deleteDialog: ContactsDeleteContactDialogProps;
  signerMismatchDialog: ContactsEditSignerMismatchDialogProps;
}>;

export function useContactDetailEditDeleteAdapter(
  contactId: ContactId | undefined,
  onDeleteSuccess: () => void,
  deviceIntents: ContactDeviceIntentsPort,
): ContactDetailEditDeleteDialogProps {
  const analytics = useContactsAnalytics();
  const meContact = useContactsMeContact();
  const ports = useContactsEditDeletePorts(deviceIntents);
  const resolvedContactId = contactId ?? ContactIdSchema.parse("contact-me");
  const { flow, renameViewModel } = useContactDetailEditDeleteFlowBindings({
    contactId: resolvedContactId,
    ports,
    onDeleteSuccess,
  });
  const uiState = useMemo(
    () => createContactDetailEditDeleteUiState(flow, renameViewModel),
    [flow, renameViewModel],
  );
  const { onEdit, onDelete, onConfirmDelete, onValidateEdit } = useContactDetailEditDeleteAnalytics(
    analytics,
    flow,
    uiState.signerMismatch.isOpen,
    resolvedContactId === meContact.id,
  );

  return {
    detailActions: contactId
      ? {
          canDelete: flow.canDelete,
          onEdit,
          onDelete,
        }
      : undefined,
    renameDialog: {
      ...uiState.rename,
      onConfirm: async () => {
        onValidateEdit();
        await uiState.rename.onConfirm();
      },
    },
    deleteDialog: { ...uiState.delete, onConfirm: onConfirmDelete },
    signerMismatchDialog: uiState.signerMismatch,
  };
}
