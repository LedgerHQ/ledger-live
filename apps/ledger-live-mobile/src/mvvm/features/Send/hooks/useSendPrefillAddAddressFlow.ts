import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { addAddress, contactAddress, type Contact } from "@domain/entity-contact";
import { resolvePrefillAddAddressParams } from "@ledgerhq/live-common/flows/send/recipient/utils/resolvePrefillAddAddressParams";
import { CONTACTS_EVENT_SOURCE } from "@features/flow-contacts";
import {
  buildContactsGlobalProperties,
  useContacts,
  useContactsFeature,
} from "@features/platform-contacts";
import {
  useContactsIntentsOrchestrator,
  type ContactsDeviceIntentExecutorProps,
} from "@features/platform-contacts/device";
import { getMinVersion } from "@ledgerhq/live-common/apps/support";
import {
  isPrefillAddAddressFlowOpen,
  useAddAddressFlowViewModel,
  type PrefillAddAddressFlowVisibleState,
} from "@features/flow-contacts-add-address";
import { contactsIntentLWMDefinitions } from "LLM/features/Contacts/deviceIntents/contactsIntentPlatformDefinitions";
import { useContactsAddressValidationAdapter } from "LLM/features/Contacts/hooks/useContactsAddressValidationAdapter";
import { useSendFlowData } from "LLM/features/Send/context/SendFlowContext";
import { useSendFlowTracking } from "LLM/features/Send/context/SendFlowTrackingContext";
import { getSendFlowTrackingProperties } from "@ledgerhq/ledger-wallet-framework/tracking/send";
import { screen, track } from "~/analytics";
import { useDispatch } from "~/context/hooks";

export type SendPrefillAddAddressPhase = Readonly<{
  state: PrefillAddAddressFlowVisibleState;
  onAddressLabelChange: (value: string) => void;
  onContinueFromName: () => void;
  onContinueFromReview: () => void;
}>;

export type SendPrefillAddAddressFlow = Readonly<{
  addressPhase: SendPrefillAddAddressPhase | null;
  dieProps: ContactsDeviceIntentExecutorProps | undefined;
  isOpeningAddressFlow: boolean;
  startForContact: (contact: Contact, contactType: "new" | "existing") => Promise<void>;
  goBackFromAddressPhase: () => void;
  closeAddressFlow: () => void;
}>;

export type UseSendPrefillAddAddressFlowOptions = Readonly<{
  onSaved?: () => void;
}>;

export function useSendPrefillAddAddressFlow({
  onSaved,
}: UseSendPrefillAddAddressFlowOptions = {}): SendPrefillAddAddressFlow {
  const dispatch = useDispatch();
  const { state, recipientSearch } = useSendFlowData();
  const contacts = useContacts();
  const { isEnabled: isContactsFeatureEnabled } = useContactsFeature("mobile");
  const { inputMethod, markContactSaved } = useSendFlowTracking();
  const [isOpeningAddressFlow, setIsOpeningAddressFlow] = useState(false);
  const selectedContactRef = useRef<Contact | null>(null);
  const contactTypeRef = useRef<"new" | "existing">("new");
  const saveRequestId = useRef(0);
  const isSaving = useRef(false);
  const addressValidation = useContactsAddressValidationAdapter();
  const { deviceIntents, dieProps } = useContactsIntentsOrchestrator({
    intents: contactsIntentLWMDefinitions,
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

    void screen("Modal send - name address", undefined, {
      ...trackingProperties,
      network: addressFlowState.displayContext.network.networkId,
      asset: addressFlowState.selectedCurrencyId,
    });
  }, [addressFlowState, isAddressPhase, trackingProperties]);

  const cancelPendingSave = useCallback(() => {
    saveRequestId.current += 1;
    isSaving.current = false;
  }, []);

  /**
   * Closing does not cancel a registration already handed to the device: the drawer also
   * closes to free the queue for the executor, and the signed address must still be saved.
   * Cancelling on the device rejects the intent, which the save path already handles.
   */
  const closeAddressFlow = useCallback(() => {
    setIsOpeningAddressFlow(false);
    close();
  }, [close]);

  const goBackFromAddressPhase = useCallback(() => {
    cancelPendingSave();
    if (addressFlowState.status === "namingAddress") {
      close();
      return;
    }
    goBack();
  }, [addressFlowState.status, cancelPendingSave, close, goBack]);

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
        contactType: contactTypeRef.current,
      });
      markContactSaved();
      close();
      onSaved?.();
    } catch {
      void screen("Modal send - address signing rejected", undefined, {
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
    deviceIntents,
    dispatch,
    inputMethod,
    markContactSaved,
    onSaved,
    state.recipient,
    trackingProperties,
  ]);

  const startForContact = useCallback(
    async (contact: Contact, contactType: "new" | "existing" = "new") => {
      selectedContactRef.current = contact;
      contactTypeRef.current = contactType;
      const params = resolvePrefillAddAddressParams({
        address: recipientSearch.value,
        currency: state.account.currency,
      });

      if (!params) {
        return;
      }

      setIsOpeningAddressFlow(true);
      try {
        await startWithPrefilled({
          contact,
          address: params.address,
          currency: params.currency,
          network: params.network,
        });
      } finally {
        setIsOpeningAddressFlow(false);
      }
    },
    [recipientSearch.value, startWithPrefilled, state.account.currency],
  );

  const addressPhase = isAddressPhase
    ? {
        state: addressFlowState,
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
          void screen("Modal send - address signing device", undefined, {
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
    dieProps,
    isOpeningAddressFlow,
    startForContact,
    goBackFromAddressPhase,
    closeAddressFlow,
  };
}
