import { ContactIdSchema, type ContactAddressId, type ContactId } from "@domain/entity-contact";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import {
  type ContactsDeleteAddressDialogProps,
  type ContactsEditSignerDialogProps,
  type ContactsEditSignerMismatchDialogProps,
  type ContactAddressDetailDialogProps,
  type ContactAddressDetailSendIntent,
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
  ContactsRenameAddressDialogProps,
} from "@features/flow-contacts-edit-address";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ContactDeviceIntentsPort } from "@features/platform-contacts";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";
import { useContactsAnalytics, resolveContactsCurrencyAnalytics } from "../../analytics";
import { useContactsAddressValidationAdapter } from "../../hooks/useContactsAddressValidationAdapter";

const MANUAL_ADDRESS_VALIDATION_DEBOUNCE_MS = 200;

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
  deviceIntents: ContactDeviceIntentsPort,
  asset?: string,
  network?: string,
): ContactAddressDetailActionsDialogProps {
  const { t } = useTranslation();
  const analytics = useContactsAnalytics();
  const ports = useContactsAddressDetailActionsPorts(deviceIntents);
  const addressValidation = useContactsAddressValidationAdapter();
  const openSendFlow = useOpenSendFlow();
  const isSelectionActive = contactId !== undefined && addressId !== undefined;
  const labels = useMemo(() => resolveContactAddressDetailActionsLabels({ t }), [t]);
  const trackQuickAction = useCallback(
    (button: Parameters<typeof trackContactAddressDetailQuickAction>[1]) => {
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
          await resolveContactsCurrencyAnalytics(payload.currencyId, {
            findTokenById: currencyId => getCryptoAssetsStore().findTokenById(currencyId),
          });
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
      openSendFlow({
        currencyIds: [intent.currencyId],
        recipient: intent.address,
        skipRecipientStep: true,
      });
      onCloseAddressDetail();
    },
    [onCloseAddressDetail, openSendFlow, trackQuickAction],
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
    renameDialog: {
      ...uiState.rename,
      onConfirm: onConfirmEditAddress,
    },
  };
}
