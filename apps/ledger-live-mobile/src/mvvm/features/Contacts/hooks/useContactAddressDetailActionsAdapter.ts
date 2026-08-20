import { ContactIdSchema, type ContactAddressId, type ContactId } from "@domain/entity-contact";
import {
  type ContactAddressDetailSendIntent,
  type ContactsDeleteAddressDrawerProps,
  type ContactsEditSignerDrawerProps,
  type ContactsEditSignerMismatchDrawerProps,
  type ContactsRenameAddressDrawerProps,
  type ContactAddressDetailDialogNativeProps,
  type ContactAddressEditSavePayload,
  CONTACTS_EVENT_SOURCE,
  CONTACTS_FLOW,
  CONTACTS_PAGE_EVENTS,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
  CONTACTS_TRACKING_BUTTON,
  createActiveContactAddressDetailActionsUiState,
  createInactiveContactAddressDetailActionsUiState,
  resolveContactAddressDetailActionsLabels,
  useContactAddressDetailActionsFlowBindings,
  useContactsAddressDetailActionsPorts,
  trackContactAddressDetailQuickAction,
} from "@features/flow-contacts";
import { useOpenSendFlow } from "LLM/features/Send/hooks/useOpenSendFlow";
import { useCallback, useEffect, useMemo, useRef } from "react";
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
  asset?: string,
  network?: string,
): ContactAddressDetailActionsFlowProps {
  const { t } = useTranslation();
  const analytics = useContactsAnalytics();
  const ports = useContactsAddressDetailActionsPorts();
  const addressValidation = useContactsAddressValidationAdapter();
  const hasTrackedEditAddressPage = useRef(false);
  const hasTrackedSignerMismatch = useRef(false);
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

  useEffect(() => {
    if (!renameViewModel.isOpen) {
      hasTrackedEditAddressPage.current = false;
      return;
    }

    if (hasTrackedEditAddressPage.current || asset === undefined || network === undefined) {
      return;
    }

    hasTrackedEditAddressPage.current = true;
    analytics.trackPage(CONTACTS_PAGE_EVENTS.EDIT_ADDRESS, {
      source: CONTACTS_EVENT_SOURCE.EDIT_ADDRESS,
      network,
      asset,
    });
  }, [analytics, asset, network, renameViewModel.isOpen]);

  useEffect(() => {
    if (flow.editUiState === "signer-mismatch" && !hasTrackedSignerMismatch.current) {
      hasTrackedSignerMismatch.current = true;
      analytics.trackEvent(CONTACTS_TRACK_EVENTS.ERROR_DISPLAYED, {
        source: CONTACTS_EVENT_SOURCE.EDIT_ADDRESS,
        page: CONTACTS_PAGE_PROPERTY.EDIT_ADDRESS,
        errorType: "signer_mismatch",
      });
      return;
    }

    if (flow.editUiState !== "signer-mismatch") {
      hasTrackedSignerMismatch.current = false;
    }
  }, [analytics, flow.editUiState]);

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
