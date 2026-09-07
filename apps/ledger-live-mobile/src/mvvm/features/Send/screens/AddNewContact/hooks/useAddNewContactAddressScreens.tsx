import React, { useMemo } from "react";
import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
} from "@domain/entity-contact";
import {
  ContactsAddAddressFlowContent,
  type ContactsAddAddressReviewLabels,
} from "@features/flow-contacts-add-address";
import type {
  QueuedDrawerFlowOptions,
  QueuedDrawerFlowScreen,
} from "LLM/components/QueuedDrawerFlow";
import { useTranslation } from "~/context/Locale";
import type { SendPrefillAddAddressPhase } from "LLM/features/Send/hooks/useSendPrefillAddAddressFlow";

const LOCKED_STEP_OPTIONS = {
  hasBackButton: true,
  noCloseButton: true,
  hideHandle: true,
  preventBackdropClick: true,
  enablePanDownToClose: false,
} as const satisfies QueuedDrawerFlowOptions;

type UseAddNewContactAddressScreensOptions = Readonly<{
  addressPhase: SendPrefillAddAddressPhase | null;
  bottomOffset: number;
}>;

export type AddNewContactAddressScreens = Readonly<{
  name: QueuedDrawerFlowScreen;
  review: QueuedDrawerFlowScreen;
}>;

export function useAddNewContactAddressScreens({
  addressPhase,
  bottomOffset,
}: UseAddNewContactAddressScreensOptions): AddNewContactAddressScreens {
  const { t } = useTranslation();
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
  const nameLabels = useMemo(
    () => ({
      title: t("contacts.addAddressName.title"),
      inputLabel: t("contacts.addAddressName.inputLabel"),
      namingDisclaimer: t("contacts.addAddressName.namingDisclaimer"),
      continueToReview: t("contacts.addAddressName.continueToReview"),
      validationErrors: {
        [INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.addAddressName.invalidLabel"),
        [DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.addAddressName.duplicateLabel"),
        [CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME]: t("contacts.addAddressName.labelTooLong"),
      },
    }),
    [t],
  );

  if (addressPhase === null) {
    return {
      name: { content: null, options: LOCKED_STEP_OPTIONS },
      review: { content: null, options: LOCKED_STEP_OPTIONS },
    };
  }

  const { state } = addressPhase;

  return {
    name: {
      content: (
        <ContactsAddAddressFlowContent
          addressEntryProps={null}
          addressNameProps={{
            addressLabel: state.addressLabel,
            labels: nameLabels,
            bottomOffset,
            onChangeText: addressPhase.onAddressLabelChange,
            onContinue: addressPhase.onContinueFromName,
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
            bottomOffset,
            onContinue: addressPhase.onContinueFromReview,
          }}
          step="review"
        />
      ),
      options: LOCKED_STEP_OPTIONS,
    },
  };
}
