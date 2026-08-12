import { ContactIdSchema, type ContactAddressId, type ContactId } from "@domain/entity-contact";
import {
  type ContactsDeleteAddressDialogProps,
  type ContactsEditSignerDialogProps,
  type ContactsEditSignerMismatchDialogProps,
  type ContactsRenameAddressDialogProps,
  type ContactAddressDetailDialogProps,
  type ContactAddressDetailSendIntent,
  createActiveContactAddressDetailActionsUiState,
  createInactiveContactAddressDetailActionsUiState,
  resolveContactAddressDetailActionsLabels,
  useContactAddressDetailActionsFlowBindings,
  useContactsAddressDetailActionsPorts,
  CONTACTS_EVENT_SOURCE,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
  CONTACTS_TRACKING_BUTTON,
  type ContactsTrackingButton,
} from "@features/flow-contacts";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";
import { useContactsAnalytics } from "../../analytics";

export type ContactAddressDetailActionsDialogProps = Readonly<{
  addressDetailDialog: Pick<
    ContactAddressDetailDialogProps,
    "onSend" | "onEdit" | "onDelete" | "canSend" | "canEdit" | "canDelete"
  >;
  deleteDialog: ContactsDeleteAddressDialogProps;
  renameDialog: ContactsRenameAddressDialogProps;
  signerDialog: ContactsEditSignerDialogProps;
  signerMismatchDialog: ContactsEditSignerMismatchDialogProps;
}>;

function mapUiStateToDialogProps(
  uiState: ReturnType<typeof createInactiveContactAddressDetailActionsUiState>,
): ContactAddressDetailActionsDialogProps {
  return {
    addressDetailDialog: uiState.addressDetailDialog,
    deleteDialog: uiState.delete,
    renameDialog: uiState.rename,
    signerDialog: uiState.signer,
    signerMismatchDialog: uiState.signerMismatch,
  };
}

export function useContactAddressDetailActionsAdapter(
  contactId: ContactId | undefined,
  addressId: ContactAddressId | undefined,
  onCloseAddressDetail: () => void,
  asset?: string,
): ContactAddressDetailActionsDialogProps {
  const { t } = useTranslation();
  const analytics = useContactsAnalytics();
  const ports = useContactsAddressDetailActionsPorts();
  const openSendFlow = useOpenSendFlow();
  const isSelectionActive = contactId !== undefined && addressId !== undefined;
  const labels = useMemo(() => resolveContactAddressDetailActionsLabels({ t }), [t]);
  const trackQuickAction = useCallback(
    (button: ContactsTrackingButton) => {
      analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
        source: CONTACTS_EVENT_SOURCE.QUICK_ACTION,
        button,
        page: CONTACTS_PAGE_PROPERTY.ADDRESS_DETAIL,
        ...(asset ? { asset } : {}),
      });
    },
    [analytics, asset],
  );
  const onSend = useCallback(
    (intent: ContactAddressDetailSendIntent) => {
      trackQuickAction(CONTACTS_TRACKING_BUTTON.send);
      openSendFlow({
        currencyIds: [intent.currencyId],
        recipient: intent.address,
      });
      onCloseAddressDetail();
    },
    [onCloseAddressDetail, openSendFlow, trackQuickAction],
  );
  const { flow, renameViewModel } = useContactAddressDetailActionsFlowBindings({
    contactId: contactId ?? ContactIdSchema.parse("contact-me"),
    addressId: isSelectionActive ? addressId : undefined,
    ports,
    onSend,
    onCloseAddressDetail,
  });
  const onEdit = useCallback(() => {
    trackQuickAction(CONTACTS_TRACKING_BUTTON.edit);
    flow.onEditPress();
  }, [flow, trackQuickAction]);
  const onDelete = useCallback(() => {
    trackQuickAction(CONTACTS_TRACKING_BUTTON.delete);
    flow.onDeletePress();
  }, [flow, trackQuickAction]);

  if (!isSelectionActive) {
    return mapUiStateToDialogProps(createInactiveContactAddressDetailActionsUiState(labels));
  }

  const uiState = createActiveContactAddressDetailActionsUiState(flow, renameViewModel, labels);

  return {
    ...mapUiStateToDialogProps(uiState),
    addressDetailDialog: {
      ...uiState.addressDetailDialog,
      onEdit,
      onDelete,
    },
  };
}
