import React, { useMemo } from "react";
import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
} from "@domain/entity-contact";
import {
  ContactsAddAddressFlowContent,
  isPrefillAddAddressFlowOpen,
  usePrefillAddAddressFlow,
  type ContactsAddAddressReviewLabels,
} from "@features/flow-contacts-add-address";
import { createMockContactDeviceIntentsPort } from "@features/platform-contacts";
import {
  QueuedDrawerFlow,
  type QueuedDrawerFlowOptions,
  type QueuedDrawerFlowScreenRegistry,
} from "LLM/components/QueuedDrawerFlow";
import { useTranslation } from "~/context/Locale";
import { useContactsAddressValidationAdapter } from "../useContactsAddressValidationAdapter";

type PrefillDrawerStep = "name" | "review";

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
  const { t } = useTranslation();
  const addressValidation = useContactsAddressValidationAdapter();
  const deviceIntents = useMemo(() => createMockContactDeviceIntentsPort(), []);
  const { state, updateAddressLabel, continueFromName, onBack, onClose, saveFromReview } =
    usePrefillAddAddressFlow({ addressValidation, deviceIntents });
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

  if (!isPrefillAddAddressFlowOpen(state)) {
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
            name: state.addressLabel.label ?? state.addressLabel.value,
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
