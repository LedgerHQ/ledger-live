import { ContactIdSchema, type ContactAddressId, type ContactId } from "@domain/entity-contact";
import {
  type ContactAddressDetailSendIntent,
  type ContactsDeleteAddressDrawerProps,
  type ContactsEditSignerDrawerProps,
  type ContactsEditSignerMismatchDrawerProps,
  type ContactsRenameAddressDrawerProps,
  type ContactAddressDetailDialogNativeProps,
  createActiveContactAddressDetailActionsUiState,
  createInactiveContactAddressDetailActionsUiState,
  resolveContactAddressDetailActionsLabels,
  useContactAddressDetailActionsFlowBindings,
  useContactsAddressDetailActionsPorts,
  CONTACTS_TRACKING_BUTTON,
  trackContactAddressDetailQuickAction,
} from "@features/flow-contacts";
import { useOpenSendFlow } from "LLM/features/Send/hooks/useOpenSendFlow";
import { useCallback, useMemo } from "react";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { useContactsAnalytics } from "../analytics/useContactsAnalytics";

export type ContactAddressDetailActionsFlowProps = Readonly<{
  addressDetailDialog: Pick<
    ContactAddressDetailDialogNativeProps,
    "onSend" | "onEdit" | "onDelete" | "canSend" | "canEdit" | "canDelete"
  >;
  deleteSheet: ContactsDeleteAddressDrawerProps;
  renameSheet: ContactsRenameAddressDrawerProps;
  signerSheet: ContactsEditSignerDrawerProps;
  signerMismatchSheet: ContactsEditSignerMismatchDrawerProps;
}>;

function mapUiStateToFlowProps(
  uiState: ReturnType<typeof createInactiveContactAddressDetailActionsUiState>,
): ContactAddressDetailActionsFlowProps {
  return {
    addressDetailDialog: uiState.addressDetailDialog,
    deleteSheet: uiState.delete,
    renameSheet: uiState.rename,
    signerSheet: uiState.signer,
    signerMismatchSheet: uiState.signerMismatch,
  };
}

export function useContactAddressDetailActionsAdapter(
  contactId: ContactId | undefined,
  addressId: ContactAddressId | undefined,
  onCloseAddressDetail: () => void,
  asset?: string,
): ContactAddressDetailActionsFlowProps {
  const { t } = useTranslation();
  const analytics = useContactsAnalytics();
  const ports = useContactsAddressDetailActionsPorts();
  const { handleOpenSendFlow } = useOpenSendFlow({
    sourceScreenName: ScreenName.MyWalletContactDetail,
  });
  const isSelectionActive = contactId !== undefined && addressId !== undefined;
  const labels = useMemo(
    () =>
      resolveContactAddressDetailActionsLabels({
        t,
        addressLabelTooLongKey: "contacts.addAddressName.labelTooLong",
      }),
    [t],
  );
  const trackQuickAction = useCallback(
    (
      button:
        | typeof CONTACTS_TRACKING_BUTTON.send
        | typeof CONTACTS_TRACKING_BUTTON.edit
        | typeof CONTACTS_TRACKING_BUTTON.delete,
    ) => {
      trackContactAddressDetailQuickAction(analytics, button, asset);
    },
    [analytics, asset],
  );
  const onSend = useCallback(
    (intent: ContactAddressDetailSendIntent) => {
      trackQuickAction(CONTACTS_TRACKING_BUTTON.send);
      handleOpenSendFlow({
        currencyIds: [intent.currencyId],
        recipient: intent.address,
      });
      onCloseAddressDetail();
    },
    [handleOpenSendFlow, onCloseAddressDetail, trackQuickAction],
  );
  const { flow, renameViewModel } = useContactAddressDetailActionsFlowBindings({
    contactId: contactId ?? ContactIdSchema.parse("contact-me"),
    addressId: isSelectionActive ? addressId : undefined,
    ports,
    onSend,
    onCloseAddressDetail,
  });
  const { onClose: closeRenameViewModel } = renameViewModel;
  const onCloseRename = useCallback(() => {
    closeRenameViewModel();
    onCloseAddressDetail();
  }, [closeRenameViewModel, onCloseAddressDetail]);
  const onEdit = useCallback(() => {
    trackQuickAction(CONTACTS_TRACKING_BUTTON.edit);
    flow.onEditPress();
  }, [flow, trackQuickAction]);
  const onDelete = useCallback(() => {
    trackQuickAction(CONTACTS_TRACKING_BUTTON.delete);
    flow.onDeletePress();
  }, [flow, trackQuickAction]);

  if (!isSelectionActive) {
    return mapUiStateToFlowProps(createInactiveContactAddressDetailActionsUiState(labels));
  }

  const uiState = mapUiStateToFlowProps(
    createActiveContactAddressDetailActionsUiState(flow, renameViewModel, labels),
  );

  return {
    ...uiState,
    addressDetailDialog: {
      ...uiState.addressDetailDialog,
      onEdit,
      onDelete,
    },
    renameSheet: {
      ...uiState.renameSheet,
      onClose: onCloseRename,
    },
  };
}
