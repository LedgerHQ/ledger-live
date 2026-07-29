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
    currencySelection,
    currentStep: resolveDrawerStep(state.status),
    isOpen: state.status !== "closed",
    labels: {
      name: t("contacts.addAddressFlow.name"),
      review: t("contacts.addAddressFlow.review"),
      success: t("contacts.addAddressFlow.success"),
      continue: t("common.continue"),
      done: t("common.done"),
    },
    onBack,
    onContinueFromName,
    onContinueFromReview,
    onFinish: onClose,
  } as const;
}

export type ContactsAddAddressFlowDrawerViewModel = ReturnType<
  typeof useContactsAddAddressFlowDrawerViewModel
>;
