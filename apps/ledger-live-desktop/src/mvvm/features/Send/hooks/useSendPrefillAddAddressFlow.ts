import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuid } from "uuid";
import {
  addAddress,
  contactAddress,
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  type Contact,
} from "@domain/entity-contact";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { resolvePrefillAddAddressParams } from "@ledgerhq/live-common/flows/send/recipient/utils/resolvePrefillAddAddressParams";
import { CONTACTS_EVENT_SOURCE } from "@features/flow-contacts";
import {
  buildContactsGlobalProperties,
  createMockContactDeviceIntentsPort,
  useContacts,
  useContactsFeature,
} from "@features/platform-contacts";
import {
  isPrefillAddAddressFlowOpen,
  useAddAddressFlowViewModel,
  type AddAddressCompletionLabels,
  type AddAddressEntryLabels,
  type ContactsAddAddressNameLabels,
  type ContactsAddAddressReviewLabels,
  type PrefillAddAddressFlowVisibleState,
} from "@features/flow-contacts-add-address";
import { useContactsAddressValidationAdapter } from "LLD/features/Contacts/hooks/useContactsAddressValidationAdapter";
import { useDispatch } from "LLD/hooks/redux";
import { useFlowWizard } from "../../FlowWizard/FlowWizardContext";
import { useSendFlowData } from "../context/SendFlowContext";
import {
  DEFAULT_ADD_NEW_CONTACT_HEADER_STATE,
  useAddNewContactHeaderController,
  type AddNewContactHeaderState,
} from "../context/AddNewContactHeaderContext";
import { useSendFlowTracking } from "../context/SendFlowTrackingContext";
import { getSendFlowTrackingProperties } from "../utils/tracking";
import { track, trackPage } from "~/renderer/analytics/segment";

export type SendPrefillAddAddressPhase = Readonly<{
  state: PrefillAddAddressFlowVisibleState;
  entryLabels: AddAddressEntryLabels;
  nameLabels: ContactsAddAddressNameLabels;
  reviewLabels: ContactsAddAddressReviewLabels;
  completionLabels: AddAddressCompletionLabels;
  onAddressLabelChange: (value: string) => void;
  onContinueFromName: () => void;
  onContinueFromReview: () => void;
}>;

export type UseSendPrefillAddAddressFlowOptions = Readonly<{
  idleHeaderState: AddNewContactHeaderState;
  contactType: "new" | "existing";
}>;

export type SendPrefillAddAddressFlow = Readonly<{
  addressPhase: SendPrefillAddAddressPhase | null;
  isOpeningAddressFlow: boolean;
  startForContact: (contact: Contact) => Promise<void>;
}>;

const ADDRESS_PHASE_HEADER_STATE: AddNewContactHeaderState = {
  titleKey: "contacts.addAddressEntry.title",
  onAddressPhaseBack: null,
};

export function useSendPrefillAddAddressFlow({
  idleHeaderState,
  contactType,
}: UseSendPrefillAddAddressFlowOptions): SendPrefillAddAddressFlow {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { navigation } = useFlowWizard<SendFlowStep>();
  const { state, recipientSearch } = useSendFlowData();
  const contacts = useContacts();
  const { isEnabled: isContactsFeatureEnabled } = useContactsFeature("desktop");
  const { inputMethod, markContactSaved } = useSendFlowTracking();
  const { setState: setHeaderState } = useAddNewContactHeaderController();
  const [isOpeningAddressFlow, setIsOpeningAddressFlow] = useState(false);
  const selectedContactRef = useRef<Contact | null>(null);
  const saveRequestId = useRef(0);
  const isSaving = useRef(false);
  const addressValidation = useContactsAddressValidationAdapter();
  const deviceIntents = useMemo(() => createMockContactDeviceIntentsPort(), []);
  const {
    state: addressFlowState,
    startWithPrefilled,
    updateAddressLabel,
    continueFromName,
    goBack,
    close,
  } = useAddAddressFlowViewModel({ addressValidation });
  const isAddressPhase = isPrefillAddAddressFlowOpen(addressFlowState);
  const trackingProperties = useMemo(
    () => ({
      ...getSendFlowTrackingProperties(state.account.account, state.account.parentAccount),
      ...buildContactsGlobalProperties({
        ffAddressBookEnabled: isContactsFeatureEnabled,
        contacts,
      }),
    }),
    [contacts, isContactsFeatureEnabled, state.account.account, state.account.parentAccount],
  );

  const trackedAddressPhaseRef = useRef("");
  useEffect(() => {
    if (
      !isAddressPhase ||
      addressFlowState.status !== "namingAddress" ||
      !addressFlowState.displayContext
    ) {
      return;
    }

    const phaseKey = [
      addressFlowState.selectedContactId,
      addressFlowState.selectedCurrencyId,
      addressFlowState.addressEntry.resolvedAddress,
    ].join(":");
    if (trackedAddressPhaseRef.current === phaseKey) {
      return;
    }
    trackedAddressPhaseRef.current = phaseKey;

    trackPage("Modal send - name address", null, {
      ...trackingProperties,
      network: addressFlowState.displayContext.network.networkId,
      asset: addressFlowState.selectedCurrencyId,
    });
  }, [addressFlowState, isAddressPhase, trackingProperties]);

  const cancelPendingSave = useCallback(() => {
    saveRequestId.current += 1;
    isSaving.current = false;
  }, []);

  const handleAddressPhaseBack = useCallback(() => {
    cancelPendingSave();
    if (addressFlowState.status === "namingAddress") {
      close();
      return;
    }
    goBack();
  }, [addressFlowState.status, cancelPendingSave, close, goBack]);

  useEffect(() => {
    if (isAddressPhase) {
      setHeaderState({
        ...ADDRESS_PHASE_HEADER_STATE,
        onAddressPhaseBack: handleAddressPhaseBack,
      });
      return;
    }

    setHeaderState(idleHeaderState);
  }, [handleAddressPhaseBack, idleHeaderState, isAddressPhase, setHeaderState]);

  useEffect(
    () => () => {
      cancelPendingSave();
      setHeaderState(DEFAULT_ADD_NEW_CONTACT_HEADER_STATE);
    },
    [cancelPendingSave, setHeaderState],
  );

  const saveFromReview = useCallback(async () => {
    if (
      isSaving.current ||
      addressFlowState.status !== "reviewingAddress" ||
      addressFlowState.entryMode !== "prefilled" ||
      !addressFlowState.displayContext
    ) {
      return;
    }
    const displayContext = addressFlowState.displayContext;

    const selectedContact = selectedContactRef.current;
    if (!selectedContact) {
      return;
    }

    const requestId = saveRequestId.current;
    isSaving.current = true;

    try {
      const signedAddress = await deviceIntents.registerExternalAddress({
        contact: selectedContact,
        currencyId: addressFlowState.selectedCurrencyId,
        label: addressFlowState.addressLabel.label,
        address: addressFlowState.addressEntry.resolvedAddress,
      });

      if (saveRequestId.current !== requestId) {
        return;
      }

      dispatch(
        addAddress({
          contactId: selectedContact.id,
          address: contactAddress({
            id: `address-${uuid()}`,
            currencyId: addressFlowState.selectedCurrencyId,
            label: addressFlowState.addressLabel.label,
            address: addressFlowState.addressEntry.resolvedAddress,
            device: signedAddress.addressDeviceContext,
          }),
          deviceCredentials: signedAddress.deviceCredentials,
        }),
      );

      track("address_added", {
        ...trackingProperties,
        source: CONTACTS_EVENT_SOURCE.ADD_ADDRESS,
        page: "address signing device",
        network: displayContext.network.networkId,
        asset: addressFlowState.selectedCurrencyId,
        inputMethod,
        isEns: Boolean(state.recipient?.ensName),
        contactType,
      });
      markContactSaved();
      close();
      navigation.resetToStep(SEND_FLOW_STEP.RECIPIENT);
    } catch {
      trackPage("Modal send - address signing rejected", null, {
        ...trackingProperties,
        network: displayContext.network.networkId,
        asset: addressFlowState.selectedCurrencyId,
      });
      return;
    } finally {
      if (saveRequestId.current === requestId) {
        isSaving.current = false;
      }
    }
  }, [
    addressFlowState,
    close,
    contactType,
    deviceIntents,
    dispatch,
    inputMethod,
    markContactSaved,
    navigation,
    state.recipient,
    trackingProperties,
  ]);

  const startForContact = useCallback(
    async (contact: Contact) => {
      selectedContactRef.current = contact;
      const params = resolvePrefillAddAddressParams({
        address: recipientSearch.value,
        currency: state.account.currency,
      });

      if (!params) {
        navigation.resetToStep(SEND_FLOW_STEP.RECIPIENT);
        return;
      }

      setIsOpeningAddressFlow(true);
      try {
        const result = await startWithPrefilled({
          contact,
          address: params.address,
          currency: params.currency,
          network: params.network,
        });
        if (result.status !== "started" && result.status !== "cancelled") {
          navigation.resetToStep(SEND_FLOW_STEP.RECIPIENT);
        }
      } finally {
        setIsOpeningAddressFlow(false);
      }
    },
    [navigation, recipientSearch.value, startWithPrefilled, state.account.currency],
  );

  const entryLabels = useMemo<AddAddressEntryLabels>(
    () => ({
      title: t("contacts.addAddressEntry.title"),
      addressPlaceholder: t("contacts.addAddressEntry.addressPlaceholder"),
      confirmAddress: t("contacts.addAddressEntry.confirmAddress"),
      validatingAddress: t("contacts.addAddressEntry.validatingAddress"),
      validAddress: t("contacts.addAddressEntry.validAddress"),
      invalidAddress: t("contacts.addAddressEntry.invalidAddress"),
      domainNotFound: t("contacts.addAddressEntry.domainNotFound"),
      sanctionedAddress: t("contacts.addAddressEntry.sanctionedAddress"),
      validationUnavailable: t("contacts.addAddressEntry.validationUnavailable"),
      ensDisclaimer: t("contacts.addAddressEntry.ensDisclaimer"),
    }),
    [t],
  );
  const nameLabels = useMemo<ContactsAddAddressNameLabels>(
    () => ({
      inputLabel: t("contacts.addAddressName.inputLabel"),
      namingDisclaimer: t("contacts.addAddressName.namingDisclaimer"),
      namingDisclaimerAccessibilityLabel: t(
        "contacts.addAddressName.namingDisclaimerAccessibilityLabel",
      ),
      continueToReview: t("contacts.addAddressName.continueToReview"),
      validAddress: t("contacts.addAddressEntry.validAddress"),
      validationErrors: {
        [INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.addAddressName.invalidLabel"),
        [DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.addAddressName.duplicateLabel"),
        [CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME]: t("contacts.addAddressName.tooLongLabel"),
      },
    }),
    [t],
  );
  const reviewLabels = useMemo<ContactsAddAddressReviewLabels>(
    () => ({
      title: t("contacts.addAddressReview.title"),
      addressLabel: t("contacts.addAddressReview.addressLabel"),
      currencyLabel: t("contacts.addAddressReview.currencyLabel"),
      networkLabel: t("contacts.addAddressReview.networkLabel"),
      nameLabel: t("contacts.addAddressReview.nameLabel"),
      continue: t("contacts.addAddressReview.continue"),
    }),
    [t],
  );
  const completionLabels = useMemo<AddAddressCompletionLabels>(
    () => ({
      title: t("contacts.addAddressReview.title"),
      continue: t("contacts.addAddressReview.continue"),
      successTitle: t("contacts.addAddressReview.successTitle"),
      close: t("contacts.addAddressReview.close"),
    }),
    [t],
  );

  const addressPhase = isAddressPhase
    ? {
        state: addressFlowState,
        entryLabels,
        nameLabels,
        reviewLabels,
        completionLabels,
        onAddressLabelChange: updateAddressLabel,
        onContinueFromName: () => {
          if (addressFlowState.status !== "namingAddress" || !addressFlowState.displayContext) {
            return;
          }
          track("button_clicked", {
            button: "continue to review",
            page: "name address",
            nameEdited:
              addressFlowState.addressLabel.value !==
              addressFlowState.displayContext.assetDisplayName,
            ...trackingProperties,
          });
          continueFromName();
        },
        onContinueFromReview: () => {
          if (!addressFlowState.displayContext) {
            return;
          }
          trackPage("Modal send - address signing device", null, {
            ...trackingProperties,
            network: addressFlowState.displayContext.network.networkId,
            asset: addressFlowState.selectedCurrencyId,
          });
          void saveFromReview();
        },
      }
    : null;

  return {
    addressPhase,
    isOpeningAddressFlow,
    startForContact,
  };
}
