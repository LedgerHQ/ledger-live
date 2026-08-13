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
  CONTACTS_EVENT_SOURCE,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
  CONTACTS_TRACKING_BUTTON,
} from "@features/flow-contacts";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
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
): ContactDetailEditDeleteDialogProps {
  const { t } = useTranslation();
  const analytics = useContactsAnalytics();
  const hasTrackedSignerMismatch = useRef(false);
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
  const onEdit = useCallback(() => {
    analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.CONTACT_DETAIL,
      button: CONTACTS_TRACKING_BUTTON.editContact,
      page: CONTACTS_PAGE_PROPERTY.CONTACT_DETAIL,
    });
    flow.onEditPress();
  }, [analytics, flow]);
  const onDelete = useCallback(() => {
    analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.CONTACT_DETAIL,
      button: CONTACTS_TRACKING_BUTTON.deleteContact,
      page: CONTACTS_PAGE_PROPERTY.CONTACT_DETAIL,
    });
    flow.onDeletePress();
    flow.openDelete();
  }, [analytics, flow]);

  useEffect(() => {
    if (uiState.signerMismatch.isOpen && !hasTrackedSignerMismatch.current) {
      hasTrackedSignerMismatch.current = true;
      analytics.trackEvent(CONTACTS_TRACK_EVENTS.ERROR_DISPLAYED, {
        source: CONTACTS_EVENT_SOURCE.CONTACT_DETAIL,
        page: CONTACTS_PAGE_PROPERTY.CONTACT_DETAIL_SNAKE,
        errorType: "signer_mismatch",
      });
      return;
    }

    if (!uiState.signerMismatch.isOpen) {
      hasTrackedSignerMismatch.current = false;
    }
  }, [analytics, uiState.signerMismatch.isOpen]);

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
