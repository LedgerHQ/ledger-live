import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { v4 as uuid } from "uuid";
import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  addAddress,
  contactAddress,
  type ContactAddress,
} from "@domain/entity-contact";
import {
  ContactsAddAddressFlowContent,
  useAddAddressFlowViewModel,
  type ContactsAddAddressReviewLabels,
  type OpenPrefillAddAddressParams,
  type OpenPrefillAddAddressResult,
} from "@features/flow-contacts";
import { createMockContactDeviceIntentsPort, useContacts } from "@features/platform-contacts";
import {
  QueuedDrawerFlow,
  type QueuedDrawerFlowOptions,
  type QueuedDrawerFlowScreenRegistry,
} from "LLM/components/QueuedDrawerFlow";
import { useDispatch } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { useContactsAddressValidationAdapter } from "../useContactsAddressValidationAdapter";
import { setPrefillAddAddressFlowListener } from "./prefillAddAddressFlowStore";

type PrefillDrawerStep = "name" | "review";

type PendingRequest = Readonly<{
  resolve: (result: OpenPrefillAddAddressResult) => void;
}>;

const FLOW_OPTIONS = {
  snapPoints: ["92%"],
} as const satisfies QueuedDrawerFlowOptions;

const LOCKED_STEP_OPTIONS = {
  hasBackButton: true,
  noCloseButton: true,
  hideHandle: true,
  preventBackdropClick: true,
  enablePanDownToClose: false,
} as const satisfies QueuedDrawerFlowOptions;

function resolveStep(status: "namingAddress" | "reviewingAddress"): PrefillDrawerStep {
  return status === "namingAddress" ? "name" : "review";
}

export function PrefillAddAddressFlowRoot(): React.JSX.Element | null {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const contacts = useContacts();
  const deviceIntents = useMemo(() => createMockContactDeviceIntentsPort(), []);
  const addressValidation = useContactsAddressValidationAdapter();
  const pendingRequest = useRef<PendingRequest | null>(null);
  const {
    state,
    startWithPrefilled,
    updateAddressLabel,
    continueFromName,
    continueFromReview,
    goBack,
    close,
  } = useAddAddressFlowViewModel({ addressValidation });

  const settle = useCallback((result: OpenPrefillAddAddressResult) => {
    pendingRequest.current?.resolve(result);
    pendingRequest.current = null;
  }, []);

  const onClose = useCallback(() => {
    close();
    settle({ status: "cancelled" });
  }, [close, settle]);

  const onBack = useCallback(() => {
    if (state.status === "namingAddress") {
      onClose();
      return;
    }
    goBack();
  }, [goBack, onClose, state.status]);

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

    try {
      const signedAddress = await deviceIntents.registerExternalAddress({
        contact: selectedContact,
        currencyId: state.selectedCurrencyId,
        label: state.addressLabel.label,
        address: state.addressEntry.resolvedAddress,
      });
      const address: ContactAddress = contactAddress({
        id: `address-${uuid()}`,
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
      close();
      settle({ status: "confirmation_failed" });
    }
  }, [close, contacts, continueFromReview, deviceIntents, dispatch, settle, state]);

  const openPrefillAddAddressFlow = useCallback(
    async (params: OpenPrefillAddAddressParams): Promise<OpenPrefillAddAddressResult> => {
      const contact = contacts.find(item => item.id === params.contactId);
      if (contact === undefined) {
        return { status: "unavailable" };
      }

      const startResult = await startWithPrefilled({
        contact,
        address: params.address,
        currency: params.currency,
        network: params.network,
      });

      if (startResult.status !== "started") {
        return startResult;
      }

      return new Promise<OpenPrefillAddAddressResult>(resolve => {
        pendingRequest.current = { resolve };
      });
    },
    [contacts, startWithPrefilled],
  );

  useEffect(() => {
    setPrefillAddAddressFlowListener(openPrefillAddAddressFlow);
    return () => setPrefillAddAddressFlowListener(null);
  }, [openPrefillAddAddressFlow]);

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

  if (
    (state.status !== "namingAddress" && state.status !== "reviewingAddress") ||
    state.entryMode !== "prefilled"
  ) {
    return null;
  }

  const currentStep = resolveStep(state.status);
  const screens: QueuedDrawerFlowScreenRegistry<PrefillDrawerStep> = {
    name: {
      content: (
        <ContactsAddAddressFlowContent
          addressEntryProps={null}
          addressNameProps={{
            addressLabel: state.addressLabel,
            labels: {
              title: t("contacts.addAddressName.title"),
              inputLabel: t("contacts.addAddressName.inputLabel"),
              namingDisclaimer: t("contacts.addAddressName.namingDisclaimer"),
              continueToReview: t("contacts.addAddressName.continueToReview"),
              validationErrors: {
                [INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t(
                  "contacts.addAddressName.invalidLabel",
                ),
                [DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t(
                  "contacts.addAddressName.duplicateLabel",
                ),
                [CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME]: t(
                  "contacts.addAddressName.labelTooLong",
                ),
              },
            },
            onChangeText: updateAddressLabel,
            onContinue: continueFromName,
          }}
          addressReviewProps={null}
          step="name"
        />
      ),
      options: LOCKED_STEP_OPTIONS,
    },
    review: {
      content: (
        <ContactsAddAddressFlowContent
          addressEntryProps={null}
          addressNameProps={null}
          addressReviewProps={{
            address: state.addressEntry.resolvedAddress,
            currency: state.displayContext.assetDisplayName,
            network: state.displayContext.network.displayName,
            name: state.addressLabel.label,
            labels: reviewLabels,
            onContinue: () => {
              void saveFromReview();
            },
          }}
          step="review"
        />
      ),
      options: LOCKED_STEP_OPTIONS,
    },
  };

  return (
    <QueuedDrawerFlow
      currentStep={currentStep}
      defaultOptions={FLOW_OPTIONS}
      isOpen
      onBack={onBack}
      onClose={onClose}
      screens={screens}
      testID="contacts-prefill-add-address-flow-drawer"
    />
  );
}
