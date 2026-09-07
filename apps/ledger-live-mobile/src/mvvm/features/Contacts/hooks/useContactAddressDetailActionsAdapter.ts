import { ContactIdSchema, type ContactAddressId, type ContactId } from "@domain/entity-contact";
import {
  type ContactAddressDetailSendIntent,
  type ContactsDeleteAddressDrawerProps,
  type ContactsEditSignerDrawerProps,
  type ContactsEditSignerMismatchDrawerProps,
  type ContactAddressDetailDialogNativeProps,
  CONTACTS_EVENT_SOURCE,
  CONTACTS_FLOW,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
  CONTACTS_TRACKING_BUTTON,
  createActiveContactAddressDetailActionsUiState,
  createInactiveContactAddressDetailActionsUiState,
  resolveContactAddressDetailActionsLabels,
  useContactAddressDetailActionsFlowBindings,
  useContactAddressEditAnalytics,
  useContactsAddressDetailActionsPorts,
  trackContactAddressDetailQuickAction,
} from "@features/flow-contacts";
import type {
  ContactAddressEditSavePayload,
  ContactsRenameAddressDrawerProps,
} from "@features/flow-contacts-edit-address";
import type { ContactDeviceIntentsPort } from "@features/platform-contacts";
import { useOpenSendFlow } from "LLM/features/Send/hooks/useOpenSendFlow";
import { useCallback, useMemo } from "react";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import {
  contactsCurrencyAnalyticsDependencies,
  resolveContactsCurrencyAnalytics,
  useContactsAnalytics,
} from "../analytics";
import { useContactsAddressValidationAdapter } from "./useContactsAddressValidationAdapter";

const MANUAL_ADDRESS_VALIDATION_DEBOUNCE_MS = 200;

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
  deviceIntents: ContactDeviceIntentsPort,
  asset?: string,
  network?: string,
): ContactAddressDetailActionsFlowProps {
  const { t } = useTranslation();
  const analytics = useContactsAnalytics();
  const ports = useContactsAddressDetailActionsPorts(deviceIntents);
  const addressValidation = useContactsAddressValidationAdapter();
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
      trackContactAddressDetailQuickAction(analytics, button, asset, network);
    },
    [analytics, asset, network],
  );
  const onEditAddressSaved = useCallback(
    async (payload: ContactAddressEditSavePayload) => {
      if (payload.currencyId === undefined) {
        return;
      }

      try {
        const { network: resolvedNetwork, asset: resolvedAsset } =
          await resolveContactsCurrencyAnalytics(
            payload.currencyId,
            contactsCurrencyAnalyticsDependencies,
          );
        const inputMethod = payload.inputMethod ?? "manual";

        analytics.trackEvent(CONTACTS_TRACK_EVENTS.ADDRESS_EDITED, {
          source: CONTACTS_EVENT_SOURCE.EDIT_ADDRESS,
          network: network ?? resolvedNetwork,
          asset: asset ?? resolvedAsset,
          inputMethod,
          isEns: inputMethod === "ens",
          flow: CONTACTS_FLOW.CONTACTS,
        });
      } catch {
        // Analytics enrichment is best-effort and must not affect the user flow.
      }
    },
    [analytics, asset, network],
  );
  const onSend = useCallback(
    (intent: ContactAddressDetailSendIntent) => {
      trackQuickAction(CONTACTS_TRACKING_BUTTON.send);
      handleOpenSendFlow({
        currencyIds: [intent.currencyId],
        recipient: intent.address,
        skipRecipientStep: true,
      });
      onCloseAddressDetail();
    },
    [handleOpenSendFlow, onCloseAddressDetail, trackQuickAction],
  );
  const { flow, renameViewModel } = useContactAddressDetailActionsFlowBindings({
    contactId: contactId ?? ContactIdSchema.parse("contact-me"),
    addressId: isSelectionActive ? addressId : undefined,
    ports,
    addressValidation,
    manualValidationDebounceMs: MANUAL_ADDRESS_VALIDATION_DEBOUNCE_MS,
    onSend,
    onCloseAddressDetail,
    onEditAddressSaved,
  });
  const { onClose: closeRenameViewModel } = renameViewModel;
  const { editUiState } = flow;
  // Closing the edit sheet returns to the address detail it was opened from, the same way
  // cancelling the delete confirmation does. The selection is kept so that sheet has an address.
  const onCloseRename = useCallback(() => {
    if (editUiState !== "edit-open") {
      return;
    }

    closeRenameViewModel();
  }, [closeRenameViewModel, editUiState]);
  const onEdit = useCallback(() => {
    trackQuickAction(CONTACTS_TRACKING_BUTTON.edit);
    flow.onEditPress();
  }, [flow, trackQuickAction]);
  const onDelete = useCallback(() => {
    trackQuickAction(CONTACTS_TRACKING_BUTTON.delete);
    flow.onDeletePress();
  }, [flow, trackQuickAction]);
  const onConfirmEditAddress = useCallback(async () => {
    analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
      source: CONTACTS_EVENT_SOURCE.EDIT_ADDRESS,
      button: CONTACTS_TRACKING_BUTTON.applyChanges,
      page: CONTACTS_PAGE_PROPERTY.EDIT_ADDRESS,
      ...(asset ? { asset } : {}),
      ...(network ? { network } : {}),
      flow: CONTACTS_FLOW.CONTACTS,
    });
    await renameViewModel.onConfirm();
  }, [analytics, asset, network, renameViewModel]);

  useContactAddressEditAnalytics(analytics, {
    isEditSessionActive: flow.isEditSessionActive,
    isRenameOpen: renameViewModel.isOpen,
    isSignerMismatchOpen: flow.editUiState === "signer-mismatch",
    asset,
    network,
  });

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
      onConfirm: onConfirmEditAddress,
    },
  };
}
