import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
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
  useAddAddressFlowViewModel,
  type AddAddressCompletionLabels,
  type ContactsAddAddressNameLabels,
  type ContactsAddAddressReviewLabels,
  type OpenPrefillAddAddressParams,
  type OpenPrefillAddAddressResult,
} from "@features/flow-contacts";
import { createMockContactDeviceIntentsPort, useContacts } from "@features/platform-contacts";
import { useDispatch } from "LLD/hooks/redux";
import { ContactsAddAddressFlowDialog } from "../../screens/Contacts/components/ContactsAddAddressFlowDialog";
import type { ContactsAddAddressFlowDialogProps } from "../../screens/Contacts/components/ContactsAddAddressFlowDialog/types";
import { useContactsAddressValidationAdapter } from "../useContactsAddressValidationAdapter";
import { setPrefillAddAddressFlowListener } from "./prefillAddAddressFlowStore";

type PendingRequest = Readonly<{
  resolve: (result: OpenPrefillAddAddressResult) => void;
}>;

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
    if (state.status === "namingAddress" && state.entryMode === "prefilled") {
      onClose();
      return;
    }
    goBack();
  }, [goBack, onClose, state]);

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

  const nameLabels = useMemo<ContactsAddAddressNameLabels>(
    () => ({
      inputLabel: t("contacts.addAddressName.inputLabel"),
      namingDisclaimer: t("contacts.addAddressName.namingDisclaimer"),
      namingDisclaimerAccessibilityLabel: t(
        "contacts.addAddressName.namingDisclaimerAccessibilityLabel",
      ),
      continueToReview: t("contacts.addAddressName.continueToReview"),
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

  if (
    state.status === "closed" ||
    state.status === "selectingCurrency" ||
    state.entryMode !== "prefilled"
  ) {
    return null;
  }

  const dialogProps: ContactsAddAddressFlowDialogProps = {
    state,
    entryLabels: {
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
    },
    sanctionedAddressBanner: {
      description: t("contacts.addAddressEntry.sanctioned.description"),
      actionLabel: t("contacts.addAddressEntry.sanctioned.learnMore"),
      onAction: () => undefined,
    },
    nameLabels,
    reviewLabels,
    completionLabels,
    onAddressChange: () => undefined,
    onContinueFromAddressDetails: () => undefined,
    onAddressLabelChange: updateAddressLabel,
    onContinueFromName: continueFromName,
    onContinueFromReview: () => {
      void saveFromReview();
    },
    onCompleteMockConfirmation: () => undefined,
    onBack,
    onClose,
  };

  return <ContactsAddAddressFlowDialog {...dialogProps} />;
}
