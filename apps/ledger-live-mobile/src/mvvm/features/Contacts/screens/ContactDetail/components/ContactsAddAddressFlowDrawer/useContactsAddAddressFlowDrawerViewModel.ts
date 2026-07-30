import { Platform } from "react-native";
import { useTranslation } from "~/context/Locale";
import { shouldUseKeyboardAvoidance, useKeyboardVisible } from "~/logic/keyboardVisible";
import { useContactsCurrencySelectionAdapter } from "../../../../hooks/useContactsCurrencySelectionAdapter";
import type { ContactsAddAddressDrawerStep, ContactsAddAddressFlowDrawerProps } from "./types";

function resolveDrawerStep(
  status: ContactsAddAddressFlowDrawerProps["state"]["status"],
): ContactsAddAddressDrawerStep {
  switch (status) {
    case "closed":
    case "selectingCurrency":
      return "currency";
    case "enteringAddress":
      return "address";
    case "namingAddress":
      return "name";
    case "reviewingAddress":
      return "review";
    case "success":
      return "success";
  }
}

export function useContactsAddAddressFlowDrawerViewModel({
  state,
  eligibleNetworkIds,
  onAddressChange,
  onAddressNameChange,
  onAddressConfirm,
  onBack,
  onClose,
  onContinueFromName,
  onContinueFromReview,
  onCurrencySelected,
  onQrCodeClick,
}: ContactsAddAddressFlowDrawerProps) {
  const { t } = useTranslation();
  const { isKeyboardVisible, keyboardHeight } = useKeyboardVisible({
    eventTiming: Platform.OS === "ios" ? "will" : "did",
  });
  const bottomOffset =
    isKeyboardVisible && shouldUseKeyboardAvoidance(Platform.OS, Platform.Version)
      ? keyboardHeight
      : 0;
  const currencySelection = useContactsCurrencySelectionAdapter({
    isOpen: state.status === "selectingCurrency",
    networkIds: eligibleNetworkIds,
    onCurrencySelected,
    onSelectionCancelled: onClose,
  });

  return {
    addressEntryProps:
      state.status === "enteringAddress"
        ? {
            addressEntry: state.addressEntry,
            labels: {
              title: t("contacts.addAddressEntry.title"),
              addressPlaceholder: t("contacts.addAddressEntry.addressPlaceholder"),
              confirmAddress: t("contacts.addAddressEntry.confirmAddress"),
              validatingAddress: t("contacts.addAddressEntry.validatingAddress"),
              validAddress: t("contacts.addAddressEntry.validAddress"),
              invalidAddress: t("contacts.addAddressEntry.invalidAddress"),
              domainNotFound: t("contacts.addAddressEntry.domainNotFound"),
              validationUnavailable: t("contacts.addAddressEntry.validationUnavailable"),
              ensDisclaimer: t("contacts.addAddressEntry.ensDisclaimer"),
            },
            bottomOffset,
            onChangeText: onAddressChange,
            onConfirm: onAddressConfirm,
            onQrCodeClick,
          }
        : null,
    addressNameProps:
      state.status === "namingAddress"
        ? {
            addressLabel: state.addressLabel,
            labels: {
              title: t("contacts.addAddressName.title"),
              inputLabel: t("contacts.addAddressName.inputLabel"),
              namingDisclaimer: t("contacts.addAddressName.namingDisclaimer"),
              continueToReview: t("contacts.addAddressName.continueToReview"),
              invalidLabel: t("contacts.addAddressName.invalidLabel"),
              duplicateLabel: t("contacts.addAddressName.duplicateLabel"),
            },
            bottomOffset,
            onChangeText: onAddressNameChange,
            onContinue: onContinueFromName,
          }
        : null,
    currencySelection,
    currentStep: resolveDrawerStep(state.status),
    isOpen: state.status !== "closed",
    labels: {
      review: t("contacts.addAddressFlow.review"),
      success: t("contacts.addAddressFlow.success"),
      continue: t("common.continue"),
      done: t("common.done"),
    },
    onBack,
    onContinueFromReview,
    onFinish: onClose,
  } as const;
}

export type ContactsAddAddressFlowDrawerViewModel = ReturnType<
  typeof useContactsAddAddressFlowDrawerViewModel
>;
