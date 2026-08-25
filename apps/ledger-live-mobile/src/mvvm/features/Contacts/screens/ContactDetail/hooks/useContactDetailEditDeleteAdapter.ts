import { type ContactId } from "@domain/entity-contact";
import {
  type ContactsDeleteContactDrawerProps,
  type ContactsEditSignerDrawerProps,
  type ContactsEditSignerMismatchDrawerProps,
  type ContactDetailActionsLabels,
  CONTACTS_EVENT_SOURCE,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
  CONTACTS_TRACKING_BUTTON,
  createContactDetailEditDeleteUiState,
  resolveContactDetailEditDeleteLabels,
  useContactDetailEditDeleteAnalytics,
  useContactDetailEditDeleteFlowBindings,
  useContactsEditDeletePorts,
} from "@features/flow-contacts";
import type { ContactsRenameContactDrawerProps } from "@features/flow-contacts-edit-contact";
import { useCallback, useMemo, useRef } from "react";
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
    onHidden: () => void;
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
  const analytics = useContactsAnalytics();
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
  const { onEdit } = useContactDetailEditDeleteAnalytics(
    analytics,
    {
      onEditPress: flow.onEditPress,
      onDeletePress: flow.onDeletePress,
      openDelete: flow.openDelete,
    },
    uiState.signerMismatch.isOpen,
  );
  const pendingDeleteRef = useRef(false);
  const onDelete = useCallback(() => {
    analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.CONTACT_DETAIL,
      button: CONTACTS_TRACKING_BUTTON.deleteContact,
      page: CONTACTS_PAGE_PROPERTY.CONTACT_DETAIL,
    });
    pendingDeleteRef.current = true;
    flow.onDeletePress();
  }, [analytics, flow]);
  const onActionsMenuHidden = useCallback(() => {
    if (!pendingDeleteRef.current) {
      return;
    }

    pendingDeleteRef.current = false;
    flow.openDelete();
  }, [flow]);

  return {
    onOpenActionsMenu: flow.onOpenActionsMenu,
    actionsMenu: {
      isOpen: flow.isActionsMenuOpen,
      canDelete: flow.canDelete,
      labels: labels.actions,
      onEdit,
      onDelete,
      onClose: flow.onCloseActionsMenu,
      onHidden: onActionsMenuHidden,
    },
    renameDrawer: uiState.rename,
    deleteDrawer: uiState.delete,
    signerDrawer: uiState.signer,
    signerMismatchSheet: uiState.signerMismatch,
  };
}
