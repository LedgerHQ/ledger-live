import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { addAddress, contactAddress, type Contact } from "@domain/entity-contact";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { resolvePrefillAddAddressParams } from "@ledgerhq/live-common/flows/send/recipient/utils/resolvePrefillAddAddressParams";
import { getMinVersion } from "@ledgerhq/live-common/apps/support";
import {
  useContactsIntentsOrchestrator,
  type ContactsDeviceIntentExecutorProps,
} from "@features/platform-contacts/device";
import { CONTACTS_EVENT_SOURCE } from "@features/flow-contacts";
import {
  buildContactsGlobalProperties,
  useContacts,
  useContactsFeature,
} from "@features/platform-contacts";
import {
  isPrefillAddAddressFlowOpen,
  useAddAddressFlowViewModel,
  type PrefillAddAddressFlowVisibleState,
} from "@features/flow-contacts-add-address";
import { useContactsAddressValidationAdapter } from "LLD/features/Contacts/hooks/useContactsAddressValidationAdapter";
import { contactsIntentLWDDefinitions } from "LLD/features/Contacts/deviceIntents/contactsIntentPlatformDefinitions";
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
  dieProps: ContactsDeviceIntentExecutorProps | undefined;
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
  const { deviceIntents, dieProps } = useContactsIntentsOrchestrator({
    intents: contactsIntentLWDDefinitions,
    getLiveConfigMinVersion: getMinVersion,
  });
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

  const addressPhase = isAddressPhase
    ? {
        state: addressFlowState,
        dieProps,
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
