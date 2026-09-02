import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
} from "@domain/entity-contact";
import {
  isPrefillAddAddressFlowOpen,
  usePrefillAddAddressFlow,
  type AddAddressCompletionLabels,
  type ContactsAddAddressNameLabels,
  type ContactsAddAddressReviewLabels,
} from "@features/flow-contacts-add-address";
import { useContactsIntentsOrchestrator } from "@features/platform-contacts/device";
import { getMinVersion } from "@ledgerhq/live-common/apps/support";
import { DeviceIntentExecutorLWD } from "LLD/components/DeviceIntentExecutor";
import { ContactsAddAddressFlowDialog } from "../../screens/Contacts/components/ContactsAddAddressFlowDialog";
import type { ContactsAddAddressFlowDialogProps } from "../../screens/Contacts/components/ContactsAddAddressFlowDialog/types";
import { contactsIntentLWDDefinitions } from "../../deviceIntents/contactsIntentPlatformDefinitions";
import { useContactsAddressValidationAdapter } from "../useContactsAddressValidationAdapter";

export function PrefillAddAddressFlowRoot(): React.JSX.Element | null {
  const { t } = useTranslation();
  const addressValidation = useContactsAddressValidationAdapter();
  const { deviceIntents, dieProps } = useContactsIntentsOrchestrator({
    intents: contactsIntentLWDDefinitions,
    getLiveConfigMinVersion: getMinVersion,
  });
  const { state, updateAddressLabel, continueFromName, onBack, onClose, saveFromReview } =
    usePrefillAddAddressFlow({ addressValidation, deviceIntents });

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

  if (dieProps?.enabled === true) {
    return <DeviceIntentExecutorLWD sourceFlow="contacts" {...dieProps} />;
  }

  if (!isPrefillAddAddressFlowOpen(state)) {
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
