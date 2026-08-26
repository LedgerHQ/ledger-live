import { useCallback, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { v4 as uuid } from "uuid";
import { addAddress, contactAddress, type Contact } from "@domain/entity-contact";
import { createMockContactDeviceIntentsPort } from "@features/platform-contacts";
import {
  isPrefillAddAddressFlowOpen,
  useAddAddressFlowViewModel,
  type AddAddressFlowState,
  type PrefillAddAddressFlowVisibleState,
} from "@features/flow-contacts-add-address";
import { useContactsAddContactDrawerAdapter } from "LLM/features/Contacts/screens/ContactsPage/hooks/useContactsAddContactDrawerAdapter";
import { useContactsAddressValidationAdapter } from "LLM/features/Contacts/hooks/useContactsAddressValidationAdapter";
import { useSendFlowData } from "LLM/features/Send/context/SendFlowContext";
import { useDispatch } from "~/context/hooks";
import { shouldUseKeyboardAvoidance, useKeyboardVisible } from "~/logic/keyboardVisible";
import { resolvePrefillAddAddressParams } from "../utils/resolvePrefillAddAddressParams";

export type AddNewContactAddressPhase = Readonly<{
  state: PrefillAddAddressFlowVisibleState;
  onAddressLabelChange: (value: string) => void;
  onContinueFromName: () => void;
  onContinueFromReview: () => void;
  onBack: () => void;
  onClose: () => void;
}>;

export type AddNewContactDrawerStep = "contact" | "name" | "review";

export type AddNewContactViewModel = ReturnType<typeof useContactsAddContactDrawerAdapter> &
  Readonly<{
    addressPhase: AddNewContactAddressPhase | null;
    isOpeningAddressFlow: boolean;
    keyboardBottomOffset: number;
    drawerStep: AddNewContactDrawerStep;
    isDrawerOpen: boolean;
    onDrawerBack: (() => void) | undefined;
    onDrawerClose: () => void;
  }>;

function resolveDrawerStep(status: AddAddressFlowState["status"]): AddNewContactDrawerStep {
  switch (status) {
    case "namingAddress":
      return "name";
    case "reviewingAddress":
      return "review";
    default:
      return "contact";
  }
}

export function useAddNewContactViewModel(): AddNewContactViewModel {
  const dispatch = useDispatch();
  const { state, recipientSearch } = useSendFlowData();
  const { isKeyboardVisible, keyboardHeight } = useKeyboardVisible({
    eventTiming: Platform.OS === "ios" ? "will" : "did",
  });
  // Drawers extend behind the keyboard instead of shifting their content, so the bottom actions
  // need to be padded manually on the platforms that do not resize the window.
  const keyboardBottomOffset =
    isKeyboardVisible && shouldUseKeyboardAvoidance(Platform.OS, Platform.Version)
      ? keyboardHeight
      : 0;
  const [isOpeningAddressFlow, setIsOpeningAddressFlow] = useState(false);
  const createdContactRef = useRef<Contact | null>(null);
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

  const saveFromReview = useCallback(async () => {
    if (
      isSaving.current ||
      addressFlowState.status !== "reviewingAddress" ||
      addressFlowState.entryMode !== "prefilled"
    ) {
      return;
    }

    const createdContact = createdContactRef.current;
    if (!createdContact) {
      return;
    }

    const requestId = saveRequestId.current;
    isSaving.current = true;

    try {
      const signedAddress = await deviceIntents.registerExternalAddress({
        contact: createdContact,
        currencyId: addressFlowState.selectedCurrencyId,
        label: addressFlowState.addressLabel.label,
        address: addressFlowState.addressEntry.resolvedAddress,
      });

      if (saveRequestId.current !== requestId) {
        return;
      }

      dispatch(
        addAddress({
          contactId: createdContact.id,
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
    } catch {
      return;
    } finally {
      if (saveRequestId.current === requestId) {
        isSaving.current = false;
      }
    }
  }, [addressFlowState, close, deviceIntents, dispatch]);

  const handleSaveSuccess = useCallback(
    async (createdContact: Contact) => {
      createdContactRef.current = createdContact;
      const params = resolvePrefillAddAddressParams({
        contactId: createdContact.id,
        address: recipientSearch.value,
        currency: state.account.currency,
      });

      if (!params) {
        return;
      }

      setIsOpeningAddressFlow(true);
      try {
        await startWithPrefilled({
          contact: createdContact,
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

  const contactAdapter = useContactsAddContactDrawerAdapter(handleSaveSuccess);
  const { onClose: closeContactStep } = contactAdapter;
  const closeDrawer = useCallback(() => {
    cancelPendingSave();
    setIsOpeningAddressFlow(false);
    close();
    closeContactStep();
  }, [cancelPendingSave, close, closeContactStep]);

  const addressPhase = isAddressPhase
    ? {
        state: addressFlowState,
        onAddressLabelChange: updateAddressLabel,
        onContinueFromName: continueFromName,
        onContinueFromReview: () => {
          void saveFromReview();
        },
        onBack: handleAddressPhaseBack,
        onClose: closeDrawer,
      }
    : null;

  // A single drawer hosts the whole flow: it stays open while the address is being validated, so
  // the user never sees it close and reopen between the contact name and the address steps.
  const drawerStep = resolveDrawerStep(addressFlowState.status);
  const isDrawerOpen = contactAdapter.isOpen || isOpeningAddressFlow || isAddressPhase;

  return {
    ...contactAdapter,
    isSaving: contactAdapter.isSaving || isOpeningAddressFlow,
    addressPhase,
    isOpeningAddressFlow,
    keyboardBottomOffset,
    drawerStep,
    isDrawerOpen,
    onDrawerBack: isAddressPhase ? handleAddressPhaseBack : undefined,
    onDrawerClose: closeDrawer,
  };
}
