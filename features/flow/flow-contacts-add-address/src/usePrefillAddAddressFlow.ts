import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { v4 as uuid } from "uuid";
import { addAddress, contactAddress, type ContactAddress } from "@domain/entity-contact";
import {
  useContacts,
  type ContactDeviceIntentsPort,
  type ContactsAddressValidationPort,
} from "@features/platform-contacts";
import type { OpenPrefillAddAddressParams, OpenPrefillAddAddressResult } from "./prefillAddAddress";
import { setPrefillAddAddressFlowListener } from "./prefillAddAddressFlowStore";
import type { AddAddressDisplayContext, AddAddressFlowState } from "./state/types";
import {
  useAddAddressFlowViewModel,
  type UseAddAddressFlowViewModelOptions,
} from "./state/useAddAddressFlowViewModel";

type PendingRequest = Readonly<{
  resolve: (result: OpenPrefillAddAddressResult) => void;
}>;

export type PrefillAddAddressFlowVisibleState = Extract<
  AddAddressFlowState,
  { status: "namingAddress" | "reviewingAddress" }
> &
  Readonly<{
    entryMode: "prefilled";
    displayContext: AddAddressDisplayContext;
  }>;

export type UsePrefillAddAddressFlowOptions = Readonly<{
  addressValidation: ContactsAddressValidationPort;
  deviceIntents: ContactDeviceIntentsPort;
  createAddressId?: () => string;
  manualValidationDebounceMs?: UseAddAddressFlowViewModelOptions["manualValidationDebounceMs"];
}>;

export type PrefillAddAddressFlowController = Readonly<{
  state: AddAddressFlowState;
  updateAddressLabel: (label: string) => void;
  continueFromName: () => void;
  onBack: () => void;
  onClose: () => void;
  saveFromReview: () => Promise<void>;
}>;

function createPrefillAddressId(): string {
  return `address-${uuid()}`;
}

export function isPrefillAddAddressFlowOpen(
  state: AddAddressFlowState,
): state is PrefillAddAddressFlowVisibleState {
  return (
    (state.status === "namingAddress" || state.status === "reviewingAddress") &&
    state.entryMode === "prefilled" &&
    state.displayContext !== null
  );
}

export function usePrefillAddAddressFlow({
  addressValidation,
  deviceIntents,
  createAddressId = createPrefillAddressId,
  manualValidationDebounceMs,
}: UsePrefillAddAddressFlowOptions): PrefillAddAddressFlowController {
  const dispatch = useDispatch();
  const contacts = useContacts();
  const pendingRequest = useRef<PendingRequest | null>(null);
  const {
    state,
    startWithPrefilled,
    updateAddressLabel,
    continueFromName,
    continueFromReview,
    goBack,
    close,
  } = useAddAddressFlowViewModel({ addressValidation, manualValidationDebounceMs });

  const settle = useCallback((result: OpenPrefillAddAddressResult) => {
    pendingRequest.current?.resolve(result);
    pendingRequest.current = null;
  }, []);

  const onClose = useCallback(() => {
    close();
    settle({ status: "cancelled" });
  }, [close, settle]);

  const isPrefilledNaming = state.status === "namingAddress" && state.entryMode === "prefilled";
  const onBack = useCallback(() => {
    if (isPrefilledNaming) {
      onClose();
      return;
    }
    goBack();
  }, [goBack, isPrefilledNaming, onClose]);

  const saveFromReview = useCallback(async () => {
    if (state.status !== "reviewingAddress" || state.entryMode !== "prefilled") {
      return;
    }

    const selectedContact = contacts.find(contact => contact.id === state.selectedContactId);
    if (selectedContact === undefined) {
      close();
      settle({ status: "confirmation_failed" });
      return;
    }

    const request = pendingRequest.current;
    // The user can cancel while the device confirmation is in flight: nothing may be persisted then.
    const isRequestActive = () => pendingRequest.current === request;

    try {
      const signedAddress = await deviceIntents.registerExternalAddress({
        contact: selectedContact,
        currencyId: state.selectedCurrencyId,
        label: state.addressLabel.label,
        address: state.addressEntry.resolvedAddress,
      });
      if (!isRequestActive()) {
        return;
      }

      const address: ContactAddress = contactAddress({
        id: createAddressId(),
        currencyId: state.selectedCurrencyId,
        label: state.addressLabel.label,
        address: state.addressEntry.resolvedAddress,
        device: signedAddress.addressDeviceContext,
      });

      dispatch(
        addAddress({
          contactId: state.selectedContactId,
          address,
          deviceCredentials: signedAddress.deviceCredentials,
        }),
      );
      continueFromReview();
      close();
      settle({ status: "saved", address });
    } catch {
      if (!isRequestActive()) {
        return;
      }

      close();
      settle({ status: "confirmation_failed" });
    }
  }, [
    close,
    contacts,
    continueFromReview,
    createAddressId,
    deviceIntents,
    dispatch,
    settle,
    state,
  ]);

  const openPrefillAddAddressFlow = useCallback(
    async (params: OpenPrefillAddAddressParams): Promise<OpenPrefillAddAddressResult> => {
      if (pendingRequest.current !== null) {
        return { status: "unavailable" };
      }

      const contact = contacts.find(item => item.id === params.contactId);
      if (contact === undefined) {
        return { status: "unavailable" };
      }

      // Registered before any await so an unmount while starting still settles the caller.
      let resolveRequest!: (result: OpenPrefillAddAddressResult) => void;
      const request = new Promise<OpenPrefillAddAddressResult>(resolve => {
        resolveRequest = resolve;
      });
      pendingRequest.current = { resolve: resolveRequest };

      const startResult = await startWithPrefilled({
        contact,
        address: params.address,
        currency: params.currency,
        network: params.network,
      });

      if (startResult.status !== "started") {
        settle(startResult);
      }

      return request;
    },
    [contacts, settle, startWithPrefilled],
  );

  useEffect(() => {
    setPrefillAddAddressFlowListener(openPrefillAddAddressFlow);
    return () => setPrefillAddAddressFlowListener(null);
  }, [openPrefillAddAddressFlow]);
  useEffect(() => () => settle({ status: "unavailable" }), [settle]);

  return {
    state,
    updateAddressLabel,
    continueFromName,
    onBack,
    onClose,
    saveFromReview,
  };
}
