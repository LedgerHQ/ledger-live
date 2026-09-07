import { useCallback, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { addAddress, contactAddress, type Contact } from "@domain/entity-contact";
import { resolvePrefillAddAddressParams } from "@ledgerhq/live-common/flows/send/recipient/utils/resolvePrefillAddAddressParams";
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
  startForContact: (contact: Contact) => Promise<void>;
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
  const [isOpeningAddressFlow, setIsOpeningAddressFlow] = useState(false);
  const selectedContactRef = useRef<Contact | null>(null);
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
      addressFlowState.entryMode !== "prefilled"
    ) {
      return;
    }

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

      close();
      onSaved?.();
    } catch {
      return;
    } finally {
      if (saveRequestId.current === requestId) {
        isSaving.current = false;
      }
    }
  }, [addressFlowState, close, deviceIntents, dispatch, onSaved]);

  const startForContact = useCallback(
    async (contact: Contact) => {
      selectedContactRef.current = contact;
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
        onContinueFromName: continueFromName,
        onContinueFromReview: () => {
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
